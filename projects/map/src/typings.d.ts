declare module 'jsts/org/locationtech/jts/io' {
  export class WKTReader {
    constructor();
    public read(geometry: any): any;
  }
  export class WKTWriter {
    constructor();
    public write(geometry: any): string;
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
