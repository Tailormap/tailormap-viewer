import { BookmarkType, SerializedBookmark } from '../../bookmark/bookmark.model';

export interface LayerVisibilityBookmarkItem {
    layerId: number;
    visible: boolean;
}

export class LayerBookmarkHelper {
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

    private static decodeVarint(from: Uint8Array, offset: number): [number, number]|undefined {
        let result = 0;
        for (;;) {
            if (offset >= from.length) {return undefined;}

            const val = from[offset++];
            result = (result << 7) | (val & 0x7F);
            if ((val & 0x80) !== 0) {
                break;
            }
        }

        return [ result, offset ];
    }

    public static serializeLayerVisibility(items: LayerVisibilityBookmarkItem[]): SerializedBookmark {
        items = [...items].sort((a, b) => a.layerId - b.layerId);

        const relativeIds = items.map((v, i) => i === 0 ? v.layerId : v.layerId - items[i - 1].layerId - 1);
        const totalLength = relativeIds.reduce((a, v) => a + LayerBookmarkHelper.encodeVarintLength(v) + 1, 0);
        const buffer = new Uint8Array(totalLength);

        let bufferOffset = 0;
        let idOffset = 0;
        for (const item of items) {
            bufferOffset += LayerBookmarkHelper.encodeVarint(item.layerId - idOffset, buffer, bufferOffset);
            idOffset = item.layerId + 1;
            buffer[bufferOffset++] = item.visible ? 1 : 0;
        }

        return { id: BookmarkType.LAYER_VISIBILITY, value: [...buffer] };
    }

    public static deserializeLayerVisibility(bookmark: SerializedBookmark): LayerVisibilityBookmarkItem[] | undefined {
        if (bookmark.id !== BookmarkType.LAYER_VISIBILITY) {
            return undefined;
        }

        const buf = Uint8Array.from(bookmark.value);

        let offset = 0;
        let idOffset = 0;
        const items = [];
        while (offset < bookmark.value.length) {
            let val: number;
            const result = LayerBookmarkHelper.decodeVarint(buf, offset);
            if (result === undefined) {
                return undefined;
            }

            [ val, offset ] = result;

            const infoByte = buf[offset++];
            items.push({ layerId: idOffset + val, visible: (infoByte & 1) === 1 });

            idOffset += val + 1;
        }

        return items;
    }
}
