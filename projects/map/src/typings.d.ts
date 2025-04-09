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

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Cesium;
declare const CESIUM_BASE_URL;

type OlExtTransformEventKey = 'change' | 'select' | 'rotatestart' | 'rotating' | 'rotateend' |
  'translatestart' | 'translating' | 'translateend' |
  'scalestart' | 'scaling' | 'scaleend';

// Maybe we can also use https://github.com/Siedlerchr/types-ol-ext
declare module 'ol-ext/interaction/Transform' {
  import { Pointer } from 'ol/interaction';
  import { Map as OlMap } from 'ol';
  import { Feature } from 'ol';
  import { Coordinate } from 'ol/coordinate';
  import { Collection } from 'ol';
  import { Style } from 'ol/style/Style';
  import { Layer } from 'ol/layer';
  import { ConditionType } from 'ol/events/condition';

  // eslint-disable-next-line import/no-default-export
  export default class OlExtTransform extends Pointer {
    constructor(options?: {
      filter?: (feature: Feature, layer: Layer) => boolean;
      layers?: Layer | Array<Layer>;
      features?: Collection<Feature>;
      condition?: ConditionType | undefined;
      addCondition?: ConditionType | undefined;
      hitTolerance?: number;
      translateFeature?: boolean;
      translate?: boolean;
      translateBBox?: boolean;
      stretch?: boolean;
      scale?: boolean;
      rotate?: boolean;
      noFlip?: boolean;
      selection?: boolean;
      keepAspectRatio?: ConditionType;
      modifyCenter?: ConditionType;
      enableRotatedTransform?: boolean;
      keepRectangle?: boolean;
      buffer?: number;
      style?: any;
      pointRadius?: number | Array<number> | ((feature: Feature) => number | number[]);
    });
    public setMap(map: OlMap | null): void;
    public setActive(b: boolean): void;
    public setDefaultStyle(options: { stroke: Style; fill: Style; pointStroke: Style; pointFill: Style }): void;
    public setStyle(style: 'default' | 'translate' | 'rotate' | 'rotate0' | 'scale' | 'scale1' |
      'scale2' | 'scale3' | 'scalev' |'scaleh1' | 'scalev2', olstyle: Style | Array<Style>): void;
    public select(feature: Feature | null, add?: boolean): void;
    public setSelection(features: Collection<Feature>): void;
    public getCenter(): Coordinate | undefined;
    public setCenter(center: Coordinate): void;
    public setPointRadius(radius: number | Array<number> | ((feature: Feature) => number | number[])): void;
    public getFeatures(): Collection<Feature>;
    public on(
      type: string | Array<string>,
      listener: (event: any) => void
    ): EventsKey;
  }
}
