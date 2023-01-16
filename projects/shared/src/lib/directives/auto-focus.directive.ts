import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tmAutoFocus]',
})
export class AutoFocusDirective implements AfterViewInit {

  private static timeout: number;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  public ngAfterViewInit(): void {
    this.applyAutoFocus();
  }

  private applyAutoFocus() {
    if (AutoFocusDirective.timeout) {
      window.clearTimeout(AutoFocusDirective.timeout);
    }
    if (this.el.nativeElement === document.activeElement) {
      return;
    }

    AutoFocusDirective.timeout = window.setTimeout(() => {
      if (this.isSelectElement()) {
        this.el.nativeElement.select();
        return;
      }
      if (this.el && this.el.nativeElement && this.el.nativeElement.focus) {
        this.el.nativeElement.focus();
      }
    }, 0);
  }

  private isSelectElement() {
    return this.el &&
      this.el.nativeElement &&
      (this.el.nativeElement.nodeName || '').toLowerCase() === 'select'
      && this.el.nativeElement.select;
  }

}
