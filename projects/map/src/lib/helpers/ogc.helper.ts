import { UrlHelper } from '@tailormap-viewer/shared';

export class OgcHelper {

  public static filterOgcUrlParameters(url: string): string {
    return UrlHelper.filterUrlParameters(
      url, paramName => ![ 'request', 'service', 'version' ].includes(paramName.toLowerCase()));
  }

}
