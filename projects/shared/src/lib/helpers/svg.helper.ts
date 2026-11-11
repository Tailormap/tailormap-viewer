import DOMPurify from 'dompurify';

export class SvgHelper {

  public static getCleanSvg(svg: string | Node): string {
    if (!svg || svg === '') {
      return '';
    }
    return DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: [ 'foreignObject', 'use' ],
    });
  }

}
