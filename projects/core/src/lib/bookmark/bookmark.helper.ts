import {
  BookmarkFragment, BookmarkFragmentString, BookmarkFragmentData, BookmarkFragmentType,
  BinaryFragmentType, BinaryFragmentData,
  PositionAndZoomFragmentType, PositionAndZoomFragmentData,
  LayerAndFlagsFragmentType, LayerAndFlagsFragmentData,
  PositionFragmentType, PositionFragmentData,
} from './bookmark.model';

/* eslint-disable no-bitwise, no-dupe-class-members */

/**
 * Implementation of Xorshift32, a PRNG, with slight modifications to allow
 * mixing in entropy. It is used to lightly obfuscate the contents of bookmark
 * fragments, and as a slight checksum to handle any typos.
 *
 * @remarks
 *
 * Note that this is not a cryptographically secure PRNG at all, and the
 * changes made to it are unlikely to make it any more secure. Its only use is
 * to decrease the chances of any typos being recognized as invalid data, as
 * well as any length changes.
 */
class Xorshift {
  constructor(private a: number) {
    this.a = a | 0;
  }

  private tick(): number {
    let x = this.a;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return this.a = x;
  }

  public encode(val: number): number {
    this.tick();
    this.a ^= val;
    return this.a & 0xFF;
  }

  public decode(encoded: number): number {
    this.tick();
    const val = (this.a ^ encoded) & 0xFF;
    this.a ^= val;
    return val;
  }
}

export class BookmarkHelper {
  private static encodeVarintLength(val: number): number {
    let count = 0;
    do {
      count++;
      val = val >> 7;
    } while (val > 0);

    return count;
  }

  private static encodeVarint(val: number, into: Uint8Array, offset: number): number {
    let count = 0;
    do {
      into[offset++] = val & 0x7F;
      val = val >> 7;
      count++;
    } while (val > 0);
    into[offset - 1] |= 0x80;

    return count;
  }

  private static decodeVarint(from: Uint8Array, offset: number): [number, number] | undefined {
    let result = 0;
    for (; ;) {
      if (offset >= from.length) { return undefined; }

      const val = from[offset++];
      result = (result << 7) | (val & 0x7F);
      if ((val & 0x80) !== 0) {
        break;
      }
    }

    return [ result, offset ];
  }

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
  private static encodeBytes(id: number, data: Uint8Array): string {
    if (data.length === 0) {
      return '';
    }

    // encode the length of the data to encode, as well as the fragment's ID, into the
    // PRNG. This uses two primes, slightly distant from each other, chosen by fair dice roll.
    const obfuscation = new Xorshift(data.length * 17 + id * 257);
    const cipheredBytes = [...data].map(a => obfuscation.encode(a));

    // Encode a single 0 byte at the end. This serves as the "checksum", lowering the chances
    // of typos being picked up on.
    cipheredBytes.push(obfuscation.encode(0) & 0xFF);

    // Encode cipheredBytes as base64url.
    return btoa(String.fromCharCode.apply(null, cipheredBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private static decodeBytes(id: number, encoded: string): Uint8Array | undefined {
    const cipheredBytes = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    // minus one, as cipheredBytes has one extra "0" byte, which isn't counted in the
    // length used for obfuscation.
    const obfuscation = new Xorshift((cipheredBytes.length - 1) * 17 + id * 257);

    const data = Uint8Array.from(cipheredBytes, c => obfuscation.decode(c.charCodeAt(0)));

    // verify the checksum
    if (data[data.length - 1] !== 0) {
      return undefined;
    }

    return new Uint8Array(data.buffer, 0, data.length - 1);
  }

  public static serializeBookmarkData(bookmark: BookmarkFragment): string {
    switch (bookmark.value.type) {
      case 'positionandzoom': {
        const { position: [ x, y ], zoom, precision } = bookmark.value;

        return `${x.toFixed(precision)},${y.toFixed(precision)},${zoom.toFixed(1)}`;
      }

      case 'layerandflags': {
        const flagByteCount = Math.ceil(bookmark.value.flagTypes.length / 8);

        const items = [...bookmark.value.data].sort((a, b) => a.id - b.id);

        const relativeIds = items.map((v, i) => i === 0 ? v.id : v.id - items[i - 1].id - 1);
        const totalLength = relativeIds.reduce((a, v) => a + BookmarkHelper.encodeVarintLength(v) + flagByteCount, 0);
        const buffer = new Uint8Array(totalLength);

        let bufferOffset = 0;
        let idOffset = 0;
        for (const item of items) {
          bufferOffset += BookmarkHelper.encodeVarint(item.id - idOffset, buffer, bufferOffset);
          idOffset = item.id + 1;
          for (let i = 0; i < bookmark.value.flagTypes.length; i++) {
            const flagIndex = i % 8;
            const flagByte = (i - flagIndex) / 8;

            if (item.data[bookmark.value.flagTypes[i]]) {
              buffer[bufferOffset + flagByte] |= (1 << flagIndex);
            }
          }

          bufferOffset += flagByteCount;
        }
        return BookmarkHelper.encodeBytes(bookmark.id, buffer);
      }

      case 'binary':
        return BookmarkHelper.encodeBytes(bookmark.id, Uint8Array.from(bookmark.value.value));

      case 'position': {
        const buf = new Uint8Array(8);
        const view = new DataView(buf.buffer);
        view.setFloat32(0, bookmark.value.position[0]);
        view.setFloat32(4, bookmark.value.position[1]);

        return BookmarkHelper.encodeBytes(bookmark.id, buf);
      }
    }
  }

  public static composeBookmarks(bookmarks: BookmarkFragmentString[]): string {
    bookmarks = [...bookmarks].sort((a, b) => a.id - b.id);

    let output = '';
    for (const bookmark of bookmarks) {
      if (bookmark.data.length === 0) {
        continue;
      }

      if (bookmark.id === 0) {
        output += '@';
      } else {
        output += `!${bookmark.id}:`;
      }

      output += bookmark.data;
    }

    return output;
  }

  public static splitBookmarks(fragment: string): BookmarkFragmentString[] {
    const items = [];
    for (const bookmarkFragment of fragment.split('!')) {
      const index = bookmarkFragment.indexOf(':');
      let id;
      let fragmentData;
      if (bookmarkFragment.startsWith('@')) {
        id = 0;
        fragmentData = bookmarkFragment.substring(1);
      } else if (index === -1) {
        continue;
      } else {
        id = parseInt(bookmarkFragment.substring(0, index), 10);
        fragmentData = bookmarkFragment.substring(index + 1);
      }

      items.push({ id, data: fragmentData });
    }

    return items;
  }

  public static deserializeBookmarkFragment(id: number, fragmentData: string, key: BinaryFragmentType): BinaryFragmentData | undefined;
  public static deserializeBookmarkFragment(id: number, fragmentData: string, key: PositionAndZoomFragmentType): PositionAndZoomFragmentData | undefined;
  public static deserializeBookmarkFragment<T extends { [Property in keyof T]: boolean }>(
    id: number,
    fragmentData: string, key: LayerAndFlagsFragmentType<T>
  ): LayerAndFlagsFragmentData<T> | undefined;
  public static deserializeBookmarkFragment(id: number, fragmentData: string, key: PositionFragmentType): PositionFragmentData | undefined;
  public static deserializeBookmarkFragment(id: number, fragmentData: string, key: BookmarkFragmentType): BookmarkFragmentData | undefined {
    switch (key.type) {
      case 'binary': {
        const decoded = BookmarkHelper.decodeBytes(id, fragmentData);
        if (decoded === undefined) {
          return undefined;
        }
        return { type: 'binary', value: [...decoded] };
      }

      case 'layerandflags': {
        const decoded = BookmarkHelper.decodeBytes(id, fragmentData);
        if (decoded === undefined) {
          return undefined;
        }

        const flagByteCount = Math.ceil(key.flagTypes.length / 8);

        const entries = [];
        let offset = 0;
        let idOffset = 0;
        while (offset < decoded.length) {
          let val: number;
          const result = BookmarkHelper.decodeVarint(decoded, offset);
          if (result === undefined) {
            return undefined;
          }

          [ val, offset ] = result;

          const output: { [_: string]: boolean } = {};
          for (let i = 0; i < key.flagTypes.length; i++) {
            const flagIndex = i % 8;
            const flagByte = (i - flagIndex) / 8;
            output[key.flagTypes[i]] = (decoded[offset + flagByte] & (1 << flagIndex)) !== 0;
          }

          offset += flagByteCount;

          entries.push({ id: idOffset + val, data: output });
          idOffset += val + 1;
        }

        return { type: 'layerandflags', flagTypes: key.flagTypes, data: entries };
      }

      case 'positionandzoom': {
        const data = fragmentData.split(',');
        const precision = data[0].indexOf('.') === -1 ? 0 : data[0].length - data[0].indexOf('.') - 1;

        return { type: 'positionandzoom', position: [ parseFloat(data[0]), parseFloat(data[1]) ], zoom: parseFloat(data[2]), precision };
      }

      case 'position': {
        const decoded = BookmarkHelper.decodeBytes(id, fragmentData);
        if (decoded === undefined || decoded.length != 8) {
          return undefined;
        }

        const view = new DataView(decoded.buffer);

        const x = view.getFloat32(0);
        const y = view.getFloat32(4);

        if (!isFinite(x) || !isFinite(y)) {
            return undefined;
        }

        return { type: 'position', position: [ x, y ] };
      }
    }
  }
}
