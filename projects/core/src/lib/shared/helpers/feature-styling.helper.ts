import { MapStyleModel } from '@tailormap-viewer/map';
import { ApplicationStyleService } from '../../services/application-style.service';

export class FeatureStylingHelper {

  public static getDefaultHighlightStyle(
    styleKey: string,
    styleOverrides?: Partial<Omit<MapStyleModel, 'styleKey'>>,
  ): MapStyleModel {
    const defaultStyle: Omit<MapStyleModel, 'styleKey'> = {
      zIndex: 9999,
      strokeColor: ApplicationStyleService.getPrimaryColor(),
      strokeWidth: 5,
      pointType: 'square',
      pointFillColor: ApplicationStyleService.getPrimaryColor(),
    };
    return {
      ...defaultStyle,
      ...(styleOverrides || {}),
      styleKey,
    };
  }

}
