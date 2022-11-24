import { SerializedBookmark } from './bookmark.model';

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
    /// Encodes arbitrary binary data into a compact URL-safe form.
    ///
    /// This code has a few idiosyncrasies for totall unneeded robustness:
    /// - All bytes are XORed with a xorshift-derived stream.
    ///   The exact shape of the bookmark contents should not be
    ///   relied on, which is discouraged by this.
    /// - The xorshift codec is derived from two things: the fragment's ID,
    ///   and its length. This ensures the fragment's values can't be accidentally
    ///   or purposefully transposed with another fragment's.
    /// - As another modification, the byte being encoded is xor'd into the xorshift
    ///   state, causing a small cascade effect. This, together with the extra 0 byte
    ///   being encoded, functions as a very slight checksum, being able to handle at
    ///   least one typo (if anyone considers these typable to begin with).
    ///
    /// All of these are necessary to guarantee no (accidental) malleability can occur:
    /// - The ID number and length protect typos in the fragment id
    /// - The cipher feedback ensures typos inside the content are detected
    /// - The extra 0 byte and cipher feedback ensure the data is probably untouched
    ///
    /// As an added benefit, the obfuscation lightly decreases the chance of getting sensible
    /// words out of the whole thing.
    ///
    /// Of course, this isn't a perfect protection, but almost all one-character typos will
    /// be caught by this, which seems good enough.
    private static encodeBytes(id: number, data: Uint8Array): string {
        const obfuscation = new Xorshift(data.length * 45 + id * 105);
        const cipheredBytes = [...data].map(a => obfuscation.encode(a));
        cipheredBytes.push(obfuscation.encode(0) & 0xFF);
        return btoa(String.fromCharCode.apply(null, cipheredBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    private static decodeBytes(id: number, data: string): Uint8Array|undefined {
        const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
        const obfuscation = new Xorshift((decoded.length - 1) * 45 + id * 105);
        const decipheredBytes = Uint8Array.from(decoded, c => obfuscation.decode(c.charCodeAt(0)));
        if (decipheredBytes[decipheredBytes.length - 1] !== 0) {
            return undefined;
        }

        return new Uint8Array(decipheredBytes.buffer, 0, decipheredBytes.length - 1);
    }

    private static serializeBookmark(bookmark: SerializedBookmark): string {
        if (bookmark.id === 0) {
            const encoded = Uint8Array.from(bookmark.value);
            const decoded = new DataView(encoded.buffer);

            const center = [ decoded.getFloat64(0), decoded.getFloat64(8) ];
            const zoomLevel = decoded.getFloat32(16);
            const precision = decoded.getUint32(20);

            return `@${center[0].toFixed(precision)},${center[1].toFixed(precision)},${zoomLevel.toFixed()}`;
        } else {
            const encoded = BookmarkHelper.encodeBytes(bookmark.id, Uint8Array.from(bookmark.value));
            return `!${bookmark.id}:${encoded}`;
        }
    }

    public static composeBookmarks(bookmarks: SerializedBookmark[]): string {
        bookmarks = [...bookmarks].sort((a, b) => a.id - b.id);

        let output = '';
        for (const bookmark of bookmarks) {
            if (bookmark.value.length === 0) {
                continue;
            }

            output += BookmarkHelper.serializeBookmark(bookmark);
        }

        return output;
    }

    public static decomposeBookmarks(fragment: string): SerializedBookmark[] {
        const items = [];
        for (const bookmarkFragment of fragment.split('!')) {
            if (bookmarkFragment.startsWith('@')) {
                const data = bookmarkFragment.substring(1).split(',');

                const encoded = new Uint8Array(24);
                const decoded = new DataView(encoded.buffer);
                decoded.setFloat64(0, parseFloat(data[0]));
                decoded.setFloat64(8, parseFloat(data[1]));
                decoded.setFloat32(16, parseInt(data[2], 10));

                const precision = data[0].indexOf('.') === -1 ? 0 : data[0].length - data[0].indexOf('.') - 1;
                decoded.setUint32(20, precision);
                items.push({ id: 0, value: [...encoded] });
                continue;
            }
            const index = bookmarkFragment.indexOf(':');
            if (index === -1) {
                continue;
            }

            try {
                const id = parseInt(bookmarkFragment.substring(0, index), 10);
                const contents = BookmarkHelper.decodeBytes(id, bookmarkFragment.substring(index + 1));
                if (contents === undefined) {continue;}

                items.push({ id, value: [...contents] });
            } catch (e) {
                continue;
            }
        }

        return items;
    }
}
