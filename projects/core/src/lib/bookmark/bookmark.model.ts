export enum BookmarkType {
    POSITION_ZOOM = 0,
    LAYER_VISIBILITY = 1,
}

export interface PositionAndZoomFragmentType {
    type: 'positionandzoom';
}

export interface LayerAndFlagsFragmentType<T extends { [Property in keyof T]: boolean }> {
    type: 'layerandflags';
    flagTypes: (keyof T)[];
}

export interface BinaryFragmentType {
    type: 'binary';
}

export interface PositionFragmentType {
    type: 'position';
}


export interface PositionAndZoomFragmentData extends PositionAndZoomFragmentType {
    position: [number, number];
    zoom: number;
    precision: number;
}

export interface LayerAndFlagsFragmentData<T extends { [Property in keyof T]: boolean }> extends LayerAndFlagsFragmentType<T> {
    data: { id: number; data: T }[];
}

export interface BinaryFragmentData extends BinaryFragmentType {
    value: Array<number>;
}

export interface PositionFragmentData extends PositionFragmentType {
    position: [number, number];
}

export type BookmarkFragmentType = PositionAndZoomFragmentType | LayerAndFlagsFragmentType<{ [_: string]: boolean }> | BinaryFragmentType | PositionFragmentType;
export type BookmarkFragmentData = PositionAndZoomFragmentData | LayerAndFlagsFragmentData<{ [_: string]: boolean }> | BinaryFragmentData | PositionFragmentData;

export interface BookmarkFragment {
    id: BookmarkType | number;
    value: BookmarkFragmentData;
}

export interface BookmarkFragmentString {
    id: number;
    data: string;
}
