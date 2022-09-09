import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tmTransformUrls]',
})
export class TransformUrlsDirective implements AfterViewInit {

  constructor(public elementRef: ElementRef<HTMLElement>) {}

  public ngAfterViewInit(): void {
    const replacedLinks = this.elementRef.nativeElement.innerHTML.replace(
      /(https?:\/\/[^ ]*)/ig,
      '<a href="$1" target="_blank">$1</a>',
    );
    this.elementRef.nativeElement.innerHTML = replacedLinks;
  }

}
