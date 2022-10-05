import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tmTransformUrls]',
})
export class TransformUrlsDirective implements AfterViewInit {

  constructor(public elementRef: ElementRef<HTMLElement>) {}

  private static URL_REGEXP = /(https?:\/\/[^ ]*)/ig;
  private static IMG_REGEXP = /.*\.(jpg|jpeg|png|webp|gif)/i;
  private static VENDOR_SPECIFIC_IMAGE_REGEXP = /.*getimage.ashx.*/i;

  private static linkReplacer(match: string): string {
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
