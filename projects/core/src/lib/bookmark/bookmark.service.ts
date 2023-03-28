import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { Message } from '@bufbuild/protobuf';
import { BookmarkProtoFragmentDescriptor, BookmarkFragmentDescriptor, BookmarkID } from './bookmark.models';
import { BinaryBookmarkFragments, BookmarkFragment } from '../map/bookmark/bookmark_pb';
import { UrlHelper } from '@tailormap-viewer/shared';
import { Deflater, Inflater, mergeBuffers } from '@stardazed/zlib';

type BookmarkFragmentValueObservable = BehaviorSubject<any>;

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  private pendingFragments: Map<BookmarkID, any> = new Map();
  private fragments: Map<BookmarkFragmentDescriptor, BookmarkFragmentValueObservable> = new Map();
  private joinedBookmark: Subject<string | undefined> = new Subject();

  private getFragmentById(identifier: string): [BookmarkFragmentDescriptor, BookmarkFragmentValueObservable] | undefined {
    for(const [ descriptor, value ] of this.fragments.entries()) {
      if (descriptor.identifier === identifier) {
        return [ descriptor, value ];
      }
    }
    return undefined;
  }

  /* eslint-disable no-dupe-class-members */

  public registerFragment$<T extends Message<T>>(descriptor: BookmarkProtoFragmentDescriptor<T>): Observable<T>;
  public registerFragment$(descriptor: BookmarkFragmentDescriptor): Observable<string>;
  public registerFragment$(descriptor: BookmarkFragmentDescriptor): Observable<any> {
    const existingFragment$ = this.fragments.get(descriptor);
    if (existingFragment$ !== undefined) {
      return existingFragment$;
    }

    if (descriptor.identifier.match(/\W/)) {
      throw new Error('Invalid identifier');
    }

    const fragment$ = new BehaviorSubject(descriptor.initialValue);

    const pendingFragment = this.pendingFragments.get(descriptor.identifier);

    if (pendingFragment !== undefined) {
      fragment$.next(descriptor.deserialize(pendingFragment));
      this.pendingFragments.delete(descriptor.identifier);
    }

    this.fragments.set(descriptor, fragment$);
    return fragment$;
  }

  public updateFragment<T extends Message<T>>(descriptor: BookmarkProtoFragmentDescriptor<T>, message: T): void;
  public updateFragment(descriptor: BookmarkFragmentDescriptor, message: string): void;
  public updateFragment(descriptor: BookmarkFragmentDescriptor, message: any) {
    if (!this.fragments.has(descriptor)) {
      this.registerFragment$(descriptor as any);
    }

    const fragment$ = this.fragments.get(descriptor);
    if (fragment$ === undefined) {
      return;
    }

    fragment$.next(message);
    this._serializeBookmark();
  }

  private _serializeBookmark() {
    let output = '';

    // Binary fragments are appended at the end and compressed together, so that string ids used in multiple fragments can be efficiently
    // compressed
    const binaryFragments = new BinaryBookmarkFragments();

    const fragmentById = new Map<string, [BookmarkFragmentDescriptor, BookmarkFragmentValueObservable]>();
    for (const [ key, fragment ] of this.fragments) {
      fragmentById.set(key.identifier, [ key, fragment ]);
    }

    for(const id of [...fragmentById.keys()].sort()) {
      const fragment = fragmentById.get(id) as [BookmarkFragmentDescriptor, BookmarkFragmentValueObservable];
      const descriptor = fragment[0];
      const value = fragment[1].value;

      if (!value || value === '') {
        continue;
      }

      if (descriptor.identifier === '') {
        // This will be first when sorted by identifier
        // Value is location, no need for URL encoding
        output += '@' + value;
      } else if (descriptor.type === 'string') {
        if (value.includes('!')) {
          throw new Error('String bookmark fragment value may not contain \'!\' separator');
        }
        // Identifier does not need to be URL encoded, see regexp check in registerFragment$()
        output += `!${descriptor.identifier}:` + encodeURIComponent(value);
      } else if (descriptor.type === 'binary') {
        const bytes = descriptor.serialize(value) as Uint8Array;
        if (bytes.length > 0) {
          binaryFragments.fragments.push(new BookmarkFragment({
            identifier: descriptor.identifier,
            bytes,
          }));
        }
      }
    }

    if (binaryFragments.fragments.length > 0) {
      const protobuf = binaryFragments.toBinary();
      const deflater = new Deflater({ format: 'raw', level: 9 });
      deflater.append(protobuf);
      const buffers = deflater.finish();
      const compressed = mergeBuffers(buffers);
      console.log(`Protobuf size ${protobuf.length}, raw deflated size: ${compressed.length}, ratio ${(compressed.length / protobuf.length).toFixed(1)}`);
      const base64 = UrlHelper.bytesToUrlBase64(compressed);
      output += '!' + base64;
    }

    if (output === '') {
      this.joinedBookmark.next(undefined);
    } else {
      this.joinedBookmark.next(output);
    }
  }

  private static decodeBinaryFragments(s: string): BinaryBookmarkFragments {
    const bytes = UrlHelper.urlBase64ToBytes(s);
    const inflater = new Inflater({ raw: true });
    const buffers = inflater.append(bytes);
    const result = inflater.finish();
    if (!result.success) {
      console.log(`Error decompressing binary bookmark fragment`, result);
      return new BinaryBookmarkFragments();
    }
    const decompressed = mergeBuffers(buffers);
    return BinaryBookmarkFragments.fromBinary(decompressed);
  }

  public setBookmark(bookmark?: string) {
    const missingIdentifiers = new Set<BookmarkID>([...this.fragments.keys()].map(a => a.identifier));

    const bookmarkComponents = new Map<BookmarkID, any>();

    if (bookmark) {
      for (const component of bookmark.split('!')) {
        if (component.startsWith('@')) {
          bookmarkComponents.set('', component.substring(1));
        } else {
          const split = component.indexOf(':');
          if (split > 0) {
            // Fragment with type === 'string'
            bookmarkComponents.set(component.substring(0, split), component.substring(split + 1));
          } else if (split === -1) {
            // Binary fragments are at the end with no identifier and ':' after '!'
            const binaryFragments = BookmarkService.decodeBinaryFragments(component);
            for (const fragment of binaryFragments.fragments) {
              bookmarkComponents.set(fragment.identifier, fragment.bytes);
            }
          }
        }
      }
      console.log('Bookmark components', bookmarkComponents);
    }

    for(const [ identifier, valueFromBookmark ] of bookmarkComponents.entries()) {
      const fragment = this.getFragmentById(identifier);
      if (!fragment) {
        console.log(`Pending bookmark value for unknown descriptor with id "${identifier}"`, valueFromBookmark);
        this.pendingFragments.set(identifier, valueFromBookmark);
      } else {
        missingIdentifiers.delete(identifier);

        const descriptor = fragment[0];
        const currentValue$ = fragment[1];

        const decodedValue = descriptor.deserialize(valueFromBookmark);

        const equals = descriptor.equals(currentValue$.value, decodedValue);
        if (!equals) {
          console.log(`Emitting new bookmark value for ${descriptor.type} descriptor "${descriptor.identifier}"
            (current value "${JSON.stringify(currentValue$.value)}")`, decodedValue);
          currentValue$.next(decodedValue);
        }
      }
    }

    // Unset any existing values.
    for (const [ descriptor, value$ ] of this.fragments) {
      if (missingIdentifiers.has(descriptor.identifier)) {
        value$.next(descriptor.initialValue);
      }
    }
  }

  public getBookmarkValue$(): Observable<string | undefined> {
    return this.joinedBookmark.asObservable();
  }
}
