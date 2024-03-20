import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { Message } from '@bufbuild/protobuf';
import {
  BookmarkProtoFragmentDescriptor, BookmarkFragmentDescriptor, BookmarkID, BookmarkStringFragmentDescriptor,
  isBookmarkProtoFragmentDescriptor,
} from './bookmark.models';
import { BinaryBookmarkFragments, BookmarkFragment } from '../application-bookmark/bookmark_pb';
import { UrlHelper } from '@tailormap-viewer/shared';
import { deflate, inflate } from '@stardazed/zlib';

type BookmarkFragmentValueObservable = BehaviorSubject<any>;

// TODO: clear internal caches when route changes to different application

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {

  private static FRAGMENT_SEPARATOR = '!';
  public static LOCATION_IDENTIFIER = '@';
  private static STRING_SEPARATOR = ':';

  private pendingFragments: Map<BookmarkID, string | Uint8Array> = new Map();
  private fragments: Map<BookmarkFragmentDescriptor, BookmarkFragmentValueObservable> = new Map();
  private joinedBookmark = new BehaviorSubject<string | undefined>(undefined);
  private binaryFragmentsBase64: string | null = null;

  public getBookmarkValue$(): Observable<string> {
    return this.joinedBookmark.asObservable().pipe(filter((v): v is string => !!v));
  }

  /*
  This method is used to register and also get the value for a certain fragment
  If the bookmark url is read before calling this method, the value for the fragment is kept in the pendingFragments map
   */
  public registerFragment$<T extends Message<T>>(descriptor: BookmarkProtoFragmentDescriptor<T>): Observable<T>;
  public registerFragment$(descriptor: BookmarkFragmentDescriptor): Observable<string>;
  public registerFragment$(descriptor: BookmarkFragmentDescriptor): Observable<any> {
    const existingFragment$ = this.fragments.get(descriptor);
    if (existingFragment$ !== undefined) {
      return existingFragment$;
    }

    if (descriptor.identifier !== BookmarkService.LOCATION_IDENTIFIER && descriptor.identifier.match(/\W/)) {
      throw new Error('Invalid identifier');
    }

    const fragment$ = new BehaviorSubject(descriptor.getInitialValue());

    const pendingFragment = this.pendingFragments.get(descriptor.identifier);

    if (pendingFragment !== undefined) {
      const value = isBookmarkProtoFragmentDescriptor(descriptor) && pendingFragment instanceof Uint8Array
        ? descriptor.deserialize(pendingFragment)
        : pendingFragment;
      fragment$.next(value);
      this.pendingFragments.delete(descriptor.identifier);
    }

    this.fragments.set(descriptor, fragment$);
    return fragment$;
  }

  /*
  This method is used to update a single fragment. After that fragment has been updated, the bookmark URL is updated as a whole
   */
  public updateFragment<T extends Message<T>>(descriptor: BookmarkProtoFragmentDescriptor<T>, message: T): void;
  public updateFragment(descriptor: BookmarkStringFragmentDescriptor, message: string): void;
  public updateFragment(descriptor: BookmarkFragmentDescriptor, message: any) {
    if (!this.fragments.has(descriptor)) {
      this.registerFragment$(descriptor as any);
    }

    const fragment$ = this.fragments.get(descriptor);
    if (fragment$ === undefined) {
      return;
    }

    if (isBookmarkProtoFragmentDescriptor(descriptor)) {
      // Clear cached bookmark value of compressed binary fragments, so it gets updated
      this.binaryFragmentsBase64 = null;
    }

    fragment$.next(message);

    const [ outputs, binaryFragmentsBase64 ] = BookmarkService.createSerializedBookmark(this.fragments, this.binaryFragmentsBase64);
    if (binaryFragmentsBase64) {
      this.binaryFragmentsBase64 = binaryFragmentsBase64;
    }
    if (outputs.length === 0) {
      this.joinedBookmark.next(undefined);
    } else {
      this.joinedBookmark.next(outputs.join(''));
    }
  }

  /*
  This method is used to get the bookmark as a whole with a changed fragment
  This does not update the current bookmark URL and the change in the fragment is not persisted
   */
  public getBookmark<T extends Message<T>>(descriptor: BookmarkProtoFragmentDescriptor<T>, message: T): string;
  public getBookmark(descriptor: BookmarkStringFragmentDescriptor, message: string): string;
  public getBookmark(descriptor: BookmarkFragmentDescriptor, message: any): string {
    const fragment$ = new BehaviorSubject(message);
    const fragments = new Map(this.fragments);
    fragments.set(descriptor, fragment$);
    const binaryFragmentCache = isBookmarkProtoFragmentDescriptor(descriptor)
      ? null
      : this.binaryFragmentsBase64;
    const [outputs] = BookmarkService.createSerializedBookmark(fragments, binaryFragmentCache);
    return outputs.join('');
  }

  /*
  This method is called on booting an application. It unpacks the bookmark, splitting by the separator (!)
  Then checks for each found fragment whether it's registered or not.
  If not, it keeps it in pendingFragments for late registration
  If found, it updates the value for that fragment
  If there are fragments registered but not found in the bookmark, it resets the value to initial for those bookmarks
   */
  public setBookmark(bookmark?: string) {
    const missingIdentifiers = new Set<BookmarkID>([...this.fragments.keys()].map(a => a.identifier));
    const bookmarkComponents = this.readBookmarkComponentsFromBookmark(bookmark);

    bookmarkComponents.forEach(( valueFromBookmark, identifier ) => {
      const fragment = this.getFragmentById(identifier);
      if (!fragment) {
        // The fragment has not been registered yet, keep value in pendingFragments
        this.pendingFragments.set(identifier, valueFromBookmark);
        return;
      }
      // Fragment found, no need to clear value
      missingIdentifiers.delete(identifier);

      const descriptor = fragment[0];
      const currentValue$ = fragment[1];

      // Proto fragment
      if (isBookmarkProtoFragmentDescriptor(descriptor) && valueFromBookmark instanceof Uint8Array) {
        const decodedValue = descriptor.deserialize(valueFromBookmark);
        if (!descriptor.equals(currentValue$.value, decodedValue)) {
          currentValue$.next(decodedValue);
        }
        return;
      }

      // String fragment
      if (currentValue$.value !== valueFromBookmark) {
        currentValue$.next(valueFromBookmark);
      }
    });

    // Unset any existing values.
    this.fragments.forEach((value$, descriptor) => {
      if (missingIdentifiers.has(descriptor.identifier)) {
        value$.next(descriptor.getInitialValue());
      }
    });
  }

  // Read the bookmark string and parse into fragments (string or binary)
  private readBookmarkComponentsFromBookmark(bookmark: string | undefined | null): Map<BookmarkID, string | Uint8Array> {
    if (!bookmark) {
      return new Map();
    }
    const components: [ string, string | Uint8Array ][][] = bookmark
      .split(BookmarkService.FRAGMENT_SEPARATOR)
      .map(component => {
        if (component.startsWith(BookmarkService.LOCATION_IDENTIFIER)) {
          return [[ BookmarkService.LOCATION_IDENTIFIER, component.substring(1) ]];
        }
        const stringSeparatorIdx = component.indexOf(BookmarkService.STRING_SEPARATOR);
        if (stringSeparatorIdx > 0) {
          // Fragment with type === 'string'
          return [[ component.substring(0, stringSeparatorIdx), decodeURIComponent(component.substring(stringSeparatorIdx + 1)) ]];
        }
        if (component.length === 0) {
          return [];
        }
        // Binary fragments are at the end with no identifier and ':' after '!'
        const binaryFragments = BookmarkService.decodeBinaryFragments(component);
        return binaryFragments.fragments.map(fragment => [ fragment.identifier, fragment.bytes ]);
      });
    return new Map(components.flat());
  }

  private getFragmentById(identifier: string): [ BookmarkFragmentDescriptor, BookmarkFragmentValueObservable ] | undefined {
    for(const [ descriptor, value ] of this.fragments.entries()) {
      if (descriptor.identifier === identifier) {
        return [ descriptor, value ];
      }
    }
    return undefined;
  }

  private static createSerializedBookmark(
    fragments: Map<BookmarkFragmentDescriptor, BookmarkFragmentValueObservable>,
    binaryFragmentsBase64: string | null,
  ): [ string[], string | null ] {
    const outputs: string[] = [];

    // Binary fragments are appended at the end and compressed together, so that string ids used in multiple fragments can be efficiently
    // compressed
    const binaryFragments = new BinaryBookmarkFragments();

    const fragmentById = new Map<string, [BookmarkFragmentDescriptor, BookmarkFragmentValueObservable]>();
    for (const [ key, fragment ] of fragments) {
      fragmentById.set(key.identifier, [ key, fragment ]);
    }

    const keys = Array.from(fragmentById.keys()).sort(BookmarkService.sortBookmarkIdentifiers);
    keys.forEach(id => {
      const fragment = fragmentById.get(id);
      if (!fragment) {
        return;
      }
      const descriptor = fragment[0];
      const value = fragment[1].value;
      if (!value || value === '') {
        return;
      }
      if (descriptor.identifier === BookmarkService.LOCATION_IDENTIFIER) {
        // This will be first when sorted by identifier
        // Value is location, no need for URL encoding
        outputs.push(BookmarkService.LOCATION_IDENTIFIER, value);
      } else if (descriptor.type === 'string') {
        if (value.includes(BookmarkService.FRAGMENT_SEPARATOR)) {
          throw new Error(`String bookmark fragment value may not contain '${BookmarkService.FRAGMENT_SEPARATOR}' separator`);
        }
        // Identifier does not need to be URL encoded, see regexp check in registerFragment$()
        outputs.push(`${BookmarkService.FRAGMENT_SEPARATOR}${descriptor.identifier}:`, encodeURIComponent(value));
      } else if (isBookmarkProtoFragmentDescriptor(descriptor)) {
        // Only if binary value was changed
        if (binaryFragmentsBase64 === null) {
          const bytes = descriptor.serialize(value) as Uint8Array;
          if (bytes.length > 0) {
            binaryFragments.fragments.push(new BookmarkFragment({
              identifier: descriptor.identifier,
              bytes,
            }));
          }
        }
      }
    });

    if (binaryFragmentsBase64 !== null) {
      // Use cached value because only string fragments were updated
      outputs.push(BookmarkService.FRAGMENT_SEPARATOR, binaryFragmentsBase64);
    } else if (binaryFragments.fragments.length > 0) {
      const protobuf = binaryFragments.toBinary();
      const compressed = deflate(protobuf, { format: 'deflate', level: 9 });
      const base64 = UrlHelper.bytesToUrlBase64(compressed);
      outputs.push(BookmarkService.FRAGMENT_SEPARATOR, base64);
      binaryFragmentsBase64 = base64;
    }

    return [ outputs, binaryFragmentsBase64 ];
  }

  private static decodeBinaryFragments(s: string): BinaryBookmarkFragments {
    const bytes = UrlHelper.urlBase64ToBytes(s);
    const decompressed = inflate(bytes);
    return BinaryBookmarkFragments.fromBinary(decompressed);
  }

  private static sortBookmarkIdentifiers(k1: string, k2: string) {
      if (k1 === BookmarkService.LOCATION_IDENTIFIER) {
      return -1;
    }
    if (k2 === BookmarkService.LOCATION_IDENTIFIER) {
      return 1;
    }
    return k1.localeCompare(k2);
  }

}
