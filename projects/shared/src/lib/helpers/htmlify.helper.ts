/**
 * This helper is meant to convert some text with links and images to HTML.
 * Support for simple Markdown links, converts http-uri or images to HTML links/images.
 * For full Markdown support use the Markdown helper
 */
export class HtmlifyHelper {

  // Matches everything that starts with http until the first space
  private static readonly URL_PART = 'https?:\\/\\/[^\\s\\r\\n]*';
  // Matches a Markdown URL: [LABEL](URL)
  private static readonly MD_PART = '\\[[^\\]]+]\\(https?:\\/\\/[^) ]*\\)';

  private static readonly URL_REGEXP = new RegExp(`${HtmlifyHelper.MD_PART}|${HtmlifyHelper.URL_PART}`, 'ig');
  private static readonly IMG_REGEXP = /\.(jpg|jpeg|png|webp|svg|gif)/i;
  private static readonly VENDOR_SPECIFIC_IMAGE_REGEXP = /getimage\.ashx/i;
  private static readonly NEWLINE_REGEXP = /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g;

  public static htmlifyContents(text: string) {
    const sanitizedHTML = HtmlifyHelper.escapeHTML(text || '');
    if (!sanitizedHTML) {
      return sanitizedHTML;
    }
    const replaceUrls = sanitizedHTML.replace(HtmlifyHelper.URL_REGEXP, HtmlifyHelper.linkReplacer);
    const replacedBreaks = replaceUrls.replace(HtmlifyHelper.NEWLINE_REGEXP, '$1<br />$2');
    return replacedBreaks;
  }

  private static linkReplacer(match: string): string {
    if (match[0] === '[') { // safe to do since this is already matched using Regex, only MD URL will start with [
      const url = match.substring(match.indexOf('(') + 1, match.length - 1);
      const name = match.substring(1, match.indexOf(']'));
      return `<a href="${url}" target="_blank">${name}</a>`;
    }
    if (HtmlifyHelper.IMG_REGEXP.test(match)
      || HtmlifyHelper.VENDOR_SPECIFIC_IMAGE_REGEXP.test(match)) {
      return `<a href="${match}" target="_blank"><img src="${match}" alt="${match}" /></a>`;
    }
    return `<a href="${match}" target="_blank">${match}</a>`;
  }

  private static escapeHTML(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/(javascript|data):/g, '');
  }

}
