import { MapStyleModel } from '@tailormap-viewer/map';

export class FeatureStylingHelper {

  public static DEFAULT_HIGHLIGHT_STYLE: Omit<MapStyleModel, 'styleKey'> = {
    zIndex: 9999,
    strokeColor: '#6236ff',
    strokeWidth: 5,
    pointType: 'square',
    pointFillColor: '#6236ff',
  };

}
