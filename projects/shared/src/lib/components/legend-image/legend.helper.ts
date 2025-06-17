import { UrlHelper } from '../../helpers';

export interface GeoServerLegendOptions {
  fontName?: string;
  fontStyle?: 'italic' | 'bold';
  fontSize?: number;
  fontColor?: string;
  fontAntiAliasing?: boolean;
  bgColor?: string;
  dpi?: number;
  forceLabels?: 'on' | 'off';
  forceTitles?: 'on' | 'off';
  labelMargin?: number;
  layout?: 'vertical' | 'horizontal';
  columnheight?: number;
  rowwidth?: number;
  columns?: number;
  rows?: number;
  grouplayout?: 'vertical' | 'horizontal';
  countMatched?: boolean;
  hideEmptyRules?: boolean;
  wrap?: boolean;
  wrap_limit?: number;
}

export class LegendHelper {

  public static shouldAddVendorSpecificLegendOptions(url: string): boolean {
    // A legend image could be a fixed image without a Hi-DPI version. Only add options if the URL is a GetLegendGraphic request or a
    // proxied legend (just assume that the proxied legend is a GetLegendGraphic request).
    return LegendHelper.isGetLegendGraphicRequest(url) || new URL(url).pathname.endsWith('/proxy/legend');
  }

  public static isGetLegendGraphicRequest(url: string): boolean {
    try {
      const request = UrlHelper.getParamCaseInsensitive(new URL(url), 'REQUEST');
      return request?.toLowerCase() === 'getlegendgraphic';
    } catch(e) {
      return false;
    }
  }

  public static addGeoServerLegendOptions(url: string, legendOptions: GeoServerLegendOptions): string {
    try {
      const u = new URL(url);
      u.searchParams.set('LEGEND_OPTIONS', Object.entries(legendOptions).map(entry => entry.join(':')).join(';'));
      return u.toString();
    } catch(e) {
      return url;
    }
  }

}
