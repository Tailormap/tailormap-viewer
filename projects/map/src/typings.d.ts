declare module 'jsts/org/locationtech/jts/io' {
  export class OL3Parser {
    constructor();
    public inject(...geometryFactory: any): void;
    public read(geometry: any): any;
    public write(geometry: any): any;
  }
}

declare module 'jsts/org/locationtech/jts/operation/buffer' {
  export class BufferOp {
    public static bufferOp(geom: any, distance: number): any;
  }
}

declare module 'jsts/org/locationtech/jts/geom' {
  export class Geometry {
    constructor(geom?: any): any;
    public difference(geom: any): any;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Cesium;
declare const CESIUM_BASE_URL;
