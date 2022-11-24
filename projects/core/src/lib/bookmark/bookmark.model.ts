export enum BookmarkType {
    POSITION_ZOOM = 0,
    LAYER_VISIBILITY = 1,
}

export interface SerializedBookmark {
    id: BookmarkType | number;
    value: number[];
}
