import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'htmlify',
})
export class HtmlifyPipe implements PipeTransform {

  public constructor(private sanitizer: DomSanitizer) {}

  // Matches everything that starts with http until the first space
  private static readonly URL_PART = 'https?:\\/\\/[^ ]*';
  // Matches a Markdown URL: [LABEL](URL)
  private static readonly MD_PART = '\\[[\\w\\s\\d]+]\\(https?:\\/\\/[^) ]*\\)';

  private static readonly URL_REGEXP = new RegExp(`${HtmlifyPipe.MD_PART}|${HtmlifyPipe.URL_PART}`, 'ig');
  private static readonly IMG_REGEXP = /\.(jpg|jpeg|png|webp|gif)/i;
  private static readonly VENDOR_SPECIFIC_IMAGE_REGEXP = /getimage\.ashx/i;
  private static readonly NEWLINE_REGEXP = /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g;

  private static linkReplacer(match: string): string {
    if (match[0] === '[') { // safe to do since this is already matched using Regex, only MD URL will start with [
      const url = match.substring(match.indexOf('(') + 1, match.length - 1);
      const name = match.substring(1, match.indexOf(']'));
      return `<a href="${url}" target="_blank">${name}</a>`;
    }
    if (HtmlifyPipe.IMG_REGEXP.test(match)
      || HtmlifyPipe.VENDOR_SPECIFIC_IMAGE_REGEXP.test(match)) {
      return `<a href="${match}" target="_blank"><img src="${match}" alt="${match}" /></a>`;
    }
    return `<a href="${match}" target="_blank">${match}</a>`;
  }

  public transform(value: string | null): SafeHtml | null {
    if (typeof value === 'string') {
      const sanitizedHTML = this.sanitizer.sanitize(SecurityContext.HTML, value);
      if (!sanitizedHTML) {
        return sanitizedHTML;
      }
      return this.sanitizer.bypassSecurityTrustHtml(sanitizedHTML
        .replace(HtmlifyPipe.NEWLINE_REGEXP, '$1<br />$2')
        .replace(HtmlifyPipe.URL_REGEXP, HtmlifyPipe.linkReplacer));
    }
    return value;
  }

}
