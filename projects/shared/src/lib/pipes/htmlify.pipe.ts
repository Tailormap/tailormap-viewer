import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HtmlifyConstants } from './htmlify.constants';

@Pipe({
  name: 'htmlify',
})
export class HtmlifyPipe implements PipeTransform {

  public constructor(private sanitizer: DomSanitizer) {}

  private static readonly URL_REGEXP = new RegExp(`${HtmlifyConstants.MD_PART}|${HtmlifyConstants.URL_PART}`, 'ig');
  private static readonly IMG_REGEXP = /\.(jpg|jpeg|png|webp|svg|gif)/i;
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
      const sanitizedHTML = HtmlifyPipe.escapeText(value);
      if (!sanitizedHTML) {
        return sanitizedHTML;
      }
      const replaceUrls = sanitizedHTML.replace(HtmlifyPipe.URL_REGEXP, HtmlifyPipe.linkReplacer);
      const replacedBreaks = replaceUrls.replace(HtmlifyPipe.NEWLINE_REGEXP, '$1<br />$2');
      return this.sanitizer.bypassSecurityTrustHtml(replacedBreaks);
    }
    return value;
  }

  private static escapeText(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

}
