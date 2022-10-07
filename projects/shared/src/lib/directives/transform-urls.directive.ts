import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tmTransformUrls]',
})
export class TransformUrlsDirective implements AfterViewInit {

  constructor(public elementRef: ElementRef<HTMLElement>) {}

  // Matches everything that starts with http until the first space
  private static readonly URL_PART = 'https?:\\/\\/[^ ]*';
  // Matches a Markdown URL: [LABEL](URL)
  private static readonly MD_PART = '\\[[\\w\\s\\d]+]\\(https?:\\/\\/[^) ]*\\)';

  private static readonly URL_REGEXP = new RegExp(`${TransformUrlsDirective.MD_PART}|${TransformUrlsDirective.URL_PART}`, 'ig');
  private static readonly IMG_REGEXP = /\.(jpg|jpeg|png|webp|gif)/i;
  private static readonly VENDOR_SPECIFIC_IMAGE_REGEXP = /getimage\.ashx/i;

  private static linkReplacer(match: string): string {
    if (match[0] === '[') { // safe to do since this is already matched using Regex, only MD URL will start with [
      const url = match.substring(match.indexOf('(') + 1, match.length - 1);
      const name = match.substring(1, match.indexOf(']'));
      return `<a href="${url}" target="_blank">${name}</a>`;
    }
    if (TransformUrlsDirective.IMG_REGEXP.test(match)
      || TransformUrlsDirective.VENDOR_SPECIFIC_IMAGE_REGEXP.test(match)) {
      return `<a href="${match}" target="_blank"><img src="${match}" alt="${match}" /></a>`;
    }
    return `<a href="${match}" target="_blank">${match}</a>`;
  }

  public ngAfterViewInit(): void {
    this.elementRef.nativeElement.innerHTML = this.elementRef.nativeElement.innerHTML.replace(
      TransformUrlsDirective.URL_REGEXP,
      TransformUrlsDirective.linkReplacer,
    );
  }

}
