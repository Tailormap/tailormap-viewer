import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { Message, AnyMessage } from '@bufbuild/protobuf';
import { Xorshift } from './xorshift';
import { BookmarkFragmentProtoDescriptor, BookmarkFragmentStringDescriptor } from './bookmark.models';

/* eslint-disable no-dupe-class-members */

type AnyDescriptor = BookmarkFragmentProtoDescriptor | BookmarkFragmentStringDescriptor;

interface BookmarkFragmentInfo {
    observable: BehaviorSubject<any>;
    deserializer: (x: string) => any;
    serializer: (x: any) => string;
}

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  /*
   * Encodes arbitrary binary data into a compact URL-safe form.
   *
   * @remarks
   *
   * This code has a few idiosyncrasies for totally unneeded robustness:
   * - All bytes are XORed with a xorshift-derived stream.
   *   The exact shape of the bookmark contents should not be
   *   relied on, which is discouraged by this.
   * - The xorshift codec is derived from two things: the fragment's ID,
   *   and its length. This ensures the fragment's values can't be accidentally
   *   or purposefully transposed with another fragment's.
   * - As another modification, the byte being encoded is xor'd into the xorshift
   *   state, causing a small cascade effect. This, together with the extra 0 byte
   *   being encoded, functions as a very slight checksum, being able to handle at
   *   least one typo (if anyone considers these typable to begin with).
   *
   * All of these are necessary to increase the robustness of the format:
   * - The ID number and length protect typos in the fragment id
   * - The cipher feedback ensures typos inside the content are detected
   * - The extra 0 byte and cipher feedback ensure the data is probably untouched
   *
   * As an added benefit, the obfuscation lightly decreases the chance of getting sensible
   * words out of the whole thing.
   *
   * Of course, this isn't a perfect protection, but almost all one-character typos will
   * be caught by this, which seems good enough.
   */
  private static encodeBytes(id: string, data: Uint8Array): string {
    if (data.length === 0) {
      return '';
    }

    // encode the length of the data to encode, as well as the fragment's ID, into the
    // PRNG. This uses two primes, slightly distant from each other, chosen by fair dice roll.
    const obfuscation = new Xorshift(id, data.length);
    const cipheredBytes = [...data].map(a => obfuscation.encode(a));

    // Encode a single 0 byte at the end. This serves as the "checksum", lowering the chances
    // of typos being picked up on.
    // eslint-disable-next-line no-bitwise
    cipheredBytes.push(obfuscation.encode(0) & 0xFF);

    // Encode cipheredBytes as base64url.
    return btoa(String.fromCharCode.apply(null, cipheredBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private static decodeBytes(id: string, encoded: string): Uint8Array | undefined {
    const cipheredBytes = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    // minus one, as cipheredBytes has one extra "0" byte, which isn't counted in the
    // length used for obfuscation.
    const obfuscation = new Xorshift(id, cipheredBytes.length - 1);

    const data = Uint8Array.from(cipheredBytes, c => obfuscation.decode(c.charCodeAt(0)));

    // verify the checksum
    if (data[data.length - 1] !== 0) {
      return undefined;
    }

    return new Uint8Array(data.buffer, 0, data.length - 1);
  }

  private pendingFragments: Map<string, string> = new Map();
  private fragments: Map<BookmarkFragmentProtoDescriptor | BookmarkFragmentStringDescriptor, BookmarkFragmentInfo> = new Map();
  private joinedBookmark: Subject<string | undefined> = new Subject();

  public registerFragment$<T extends Message<T>>(descriptor: BookmarkFragmentProtoDescriptor<T>): Observable<T>;
  public registerFragment$(descriptor: BookmarkFragmentStringDescriptor): Observable<string>;
  public registerFragment$(descriptor: AnyDescriptor): Observable<any> {
      const existingFragment = this.fragments.get(descriptor);
      if (existingFragment !== undefined) {
          return existingFragment.observable;
      }

      let info: BookmarkFragmentInfo | undefined;
      if (descriptor.type === 'string') {
          info = {
            observable: new BehaviorSubject('') as any as BehaviorSubject<any>,
            serializer: (x: any) => x as string,
            deserializer: (x: string) => x as any,
          } as BookmarkFragmentInfo;
      } else if (descriptor.type === 'proto') {
          info = {
            observable: new BehaviorSubject(new descriptor.proto()) as any as BehaviorSubject<any>,
            serializer: descriptor.customSerializer?.serialize ??
              ((x: AnyMessage) => BookmarkService.encodeBytes(descriptor.identifier, x.toBinary())) as any,
            deserializer: descriptor.customSerializer?.deserialize ??
              ((x: string) => descriptor.proto.fromBinary(BookmarkService.decodeBytes(descriptor.identifier, x) ?? new Uint8Array())),
          } as BookmarkFragmentInfo;
      } else {
          throw new Error('unknown fragment type');
      }

      const pendingFragment = this.pendingFragments.get(descriptor.identifier);

      if (pendingFragment !== undefined) {
          info.observable.next(info.deserializer(pendingFragment));
          this.pendingFragments.delete(descriptor.identifier);
      }

      this.fragments.set(descriptor, info);
      return info.observable;
  }

  public updateFragment<T extends Message<T>>(descriptor: BookmarkFragmentProtoDescriptor<T>, message: T): void;
  public updateFragment(descriptor: BookmarkFragmentStringDescriptor, message: string): void;
  public updateFragment(descriptor: AnyDescriptor, message: any) {
      if (!this.fragments.has(descriptor)) {
          this.registerFragment$(descriptor as any);
      }

      const fragment = this.fragments.get(descriptor);
      if (fragment === undefined) {
          return;
      }

      fragment.observable.next(message);
      this._serializeBookmark();
  }

  private _serializeBookmark() {
      const components: Map<string, string> = new Map();
      for (const [ key, component ] of this.fragments) {
          const serialized = component.serializer(component.observable.value);
          if (serialized === undefined) {
              continue;
          }
          if (serialized.length === 0) {
              continue;
          }

          components.set(key.identifier, serialized);
      }

      let output = '';

      for (const key of [...components.keys()].sort()) {
          if (key === '') {
              output += '@';
          } else {
              output += `!${key}:`;
          }

          output += components.get(key);
      }

      if (output === '') {
          this.joinedBookmark.next(undefined);
      } else {
          this.joinedBookmark.next(output);
      }
  }

  public setBookmark(bookmark?: string) {
      const missingKeys = new Set<string>([...this.fragments.keys()].map(a => a.identifier));

      if (bookmark !== undefined) {
          outer:
          for (let component of bookmark.split('!')) {
              let identifier = '';
              if (component.startsWith('@')) {
                  identifier = '';
                  component = component.substring(1);
              } else {
                  const split = component.indexOf(':');
                  identifier = component.substring(0, split);
                  component = component.substring(split + 1);
              }

              missingKeys.delete(identifier);

              for (const [ key, value ] of this.fragments) {
                  if (key.identifier !== identifier) {
                      continue;
                  }

                  // no change
                  if (value.serializer(value.observable.value) === component) {
                      continue;
                  }

                  const deserialized = value.deserializer(component);
                  value.observable.next(deserialized);

                  continue outer;
              }

              this.pendingFragments.set(identifier, component);
          }
      }

      // Unset any existing values.
      for (const [ key, value ] of this.fragments) {
          if (missingKeys.has(key.identifier)) {
              value.observable.next(value.deserializer(''));
          }
      }
  }

  public getBookmarkValue$(): Observable<string | undefined> {
      return this.joinedBookmark.asObservable();
  }
}
