import { Icon, Style } from 'ol/style';
import { MapStyleModel } from '../../models/map-style.model';

export class ImageStyleHelper {

  private static DEFAULT_MARKER_IMAGE_SIZE = 20;

  public static getPointImageStyle(
    styleConfig: MapStyleModel,
  ) {
    const [ width, height ] = ImageStyleHelper.getPointImageSize(styleConfig);
    return new Style({ image: new Icon({
        src: styleConfig.pointImage,
        width,
        height,
        rotation: (styleConfig.pointRotation ?? 0) * Math.PI / 180,
      }),
    });
  }

  public static getPointImageSize(styleConfig: MapStyleModel): [number, number] {
    const pointSizeFactor = (styleConfig.pointSize ?? 100) / 100;
    const width = (styleConfig.pointImageWidth ?? ImageStyleHelper.DEFAULT_MARKER_IMAGE_SIZE) * pointSizeFactor;
    const height = (styleConfig.pointImageHeight ?? ImageStyleHelper.DEFAULT_MARKER_IMAGE_SIZE) * pointSizeFactor;
    return [ width, height ];
  }

  public static getSymbolSizeForLabel(styleConfig: MapStyleModel): number {
    const [ , height ] = ImageStyleHelper.getPointImageSize(styleConfig);
    return height / 2;
  }

}
