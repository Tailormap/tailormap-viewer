import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import {
  BookmarkFragmentDescriptor, BookmarkID, BookmarkJsonFragmentDescriptor, BookmarkStringFragmentDescriptor,
  isBookmarkJsonFragmentDescriptor,
} from './bookmark.models';
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

  private pendingFragments: Map<BookmarkID, string | object> = new Map();
  private fragments: Map<BookmarkFragmentDescriptor, BookmarkFragmentValueObservable> = new Map();
  private joinedBookmark = new BehaviorSubject<string | undefined>(undefined);
  private compressedJsonBase64Fragments: string | null = null;

  public getBookmarkValue$(): Observable<string> {
    return this.joinedBookmark.asObservable().pipe(filter((v): v is string => typeof v === 'string'));
  }

  public registerJsonFragment$<T>(descriptor: BookmarkJsonFragmentDescriptor<T>): Observable<T> {
    return this.registerFragment$(descriptor) as Observable<T>;
  }

  /*
  This method is used to register and also get the value for a certain fragment
  If the bookmark url is read before calling this method, the value for the fragment is kept in the pendingFragments map
   */
  public registerFragment$(descriptor: BookmarkStringFragmentDescriptor): Observable<string>;
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
      fragment$.next(pendingFragment);
      this.pendingFragments.delete(descriptor.identifier);
    }

    this.fragments.set(descriptor, fragment$);
    return fragment$;
  }

  /*
  This method is used to update a single fragment. After that fragment has been updated, the bookmark URL is updated as a whole
   */
  public updateFragment<T>(descriptor: BookmarkJsonFragmentDescriptor<T>, value: T): void;
  public updateFragment(descriptor: BookmarkStringFragmentDescriptor, value: string): void;
  public updateFragment(descriptor: BookmarkFragmentDescriptor, value: any) {
    if (!this.fragments.has(descriptor)) {
      this.registerFragment$(descriptor as any);
    }

    const fragment$ = this.fragments.get(descriptor);
    if (fragment$ === undefined) {
      return;
    }

    if (isBookmarkJsonFragmentDescriptor(descriptor)) {
      // Clear cached bookmark value of compressed json fragments, so it gets updated
      this.compressedJsonBase64Fragments = null;
    }

    fragment$.next(value);

    const [ outputs, compressedJsonBase64Fragments ] = BookmarkService.createSerializedBookmark(this.fragments, this.compressedJsonBase64Fragments);
    if (compressedJsonBase64Fragments) {
      this.compressedJsonBase64Fragments = compressedJsonBase64Fragments;
    }
    if (outputs.length === 0) {
      this.joinedBookmark.next('');
    } else {
      this.joinedBookmark.next(outputs.join(''));
    }
  }

  /*
  This method is used to get the bookmark as a whole with a changed fragment
  This does not update the current bookmark URL and the change in the fragment is not persisted
   */
  public getBookmark<T>(descriptor: BookmarkJsonFragmentDescriptor<T>, value: T): string;
  public getBookmark(descriptor: BookmarkStringFragmentDescriptor, value: string): string;
  public getBookmark(descriptor: BookmarkFragmentDescriptor, value: any): string {
    const fragment$ = new BehaviorSubject(value);
    const fragments = new Map(this.fragments);
    fragments.set(descriptor, fragment$);
    const compressedJsonBase64FragmentCache = isBookmarkJsonFragmentDescriptor(descriptor)
      ? null
      : this.compressedJsonBase64Fragments;
    const [outputs] = BookmarkService.createSerializedBookmark(fragments, compressedJsonBase64FragmentCache);
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
    if (bookmark && bookmark === this.joinedBookmark.value) {
      return;
    }
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
      if (isBookmarkJsonFragmentDescriptor(descriptor)) {
        // TODO object equality test

        //const decodedValue = descriptor.deserialize(valueFromBookmark);
        //if (!descriptor.equals(currentValue$.value, decodedValue)) {
          currentValue$.next(valueFromBookmark);
        //}
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

  // Read the bookmark string and parse into fragments (string or object)
  private readBookmarkComponentsFromBookmark(bookmark: string | undefined | null): Map<BookmarkID, string | object> {
    const components = new Map<string, string | object>();

    bookmark = bookmark || '';

    for(const component of bookmark.split(BookmarkService.FRAGMENT_SEPARATOR)) {
      const stringSeparatorIdx = component.indexOf(BookmarkService.STRING_SEPARATOR);
      if (component.startsWith(BookmarkService.LOCATION_IDENTIFIER)) {
        components.set(BookmarkService.LOCATION_IDENTIFIER, component.substring(1));
      } else if (stringSeparatorIdx > 0) {
        // Fragment with type === 'string'
        components.set(component.substring(0, stringSeparatorIdx), decodeURIComponent(component.substring(stringSeparatorIdx + 1)));
      } else if (component.length > 0) {
        // Compressed JSON fragments are at the end with no identifier and ':' after '!'
        const jsonFragments = BookmarkService.decodeCompressedJsonFragments(component);
        if (jsonFragments) {
          jsonFragments.forEach((value, identifier) => components.set(identifier, value));
        }
      }
    }
    return components;
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
    compressedJsonBase64Fragments: string | null,
  ): [ string[], string | null ] {
    const outputs: string[] = [];

    // JSON fragments are appended at the end and compressed together, so that string ids used in multiple fragments can be efficiently
    // compressed
    const jsonFragments: { [identifier: string]: object } = {};

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
      } else if (isBookmarkJsonFragmentDescriptor(descriptor)) {
        // Only if the JSON base64 value was changed
        if (compressedJsonBase64Fragments === null) {
          jsonFragments[descriptor.identifier] = value;
        }
      }
    });

    if (compressedJsonBase64Fragments !== null) {
      // Use cached value because only string fragments were updated
      outputs.push(BookmarkService.FRAGMENT_SEPARATOR, compressedJsonBase64Fragments);
    } else if (Object.keys(jsonFragments).length > 0) {
      const json = JSON.stringify(jsonFragments);
      console.log('Compressing JSON bookmark fragments', json);
      const encoded = new TextEncoder().encode(json);
      const compressed = deflate(encoded, { format: 'deflate', level: 9 });
      const base64 = UrlHelper.bytesToUrlBase64(compressed);
      outputs.push(BookmarkService.FRAGMENT_SEPARATOR, base64);
      compressedJsonBase64Fragments = base64;
    }

    return [ outputs, compressedJsonBase64Fragments ];
  }

  private static decodeCompressedJsonFragments(s: string): Map<string, object> | null {
    try {
      const bytes = UrlHelper.urlBase64ToBytes(s) as Uint8Array<ArrayBuffer>;
      const decompressed = inflate(bytes);
      const jsonString = new TextDecoder().decode(decompressed);
      const json = JSON.parse(jsonString);
      return new Map(Object.entries(json));
    } catch (_e) {
      console.warn('Failed to decode compressed JSON bookmark fragments', s);
      return null;
    }
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
