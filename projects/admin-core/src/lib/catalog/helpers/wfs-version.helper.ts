export class WfsVersionHelper {

  /**
   * Whether a WFS URL has a VERSION parameter other than 2.0.0. Only WFS 2.0.0 is supported (WFS 1.x has no paging,
   * so the attribute list can only show the first page of features). Without VERSION the API uses WFS 2.0.0.
   */
  public static isUnsupportedVersion(url: string | null | undefined): boolean {
    const version = /[?&]version=([^&#]*)/i.exec(url || '')?.[1].trim();
    return !!version && version !== '2.0.0';
  }

}
