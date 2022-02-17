import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[tmAutoFocus]',
})
export class AutoFocusDirective implements OnChanges {

  private static timeout: number;

  // This number needs to be increased by the directive using component to trigger changes
  @Input('tmAutoFocus')
  public autoFocus = 0;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['autoFocus'].currentValue !== changes['autoFocus'].previousValue
      && changes['autoFocus'].currentValue > 0) {
      this.applyAutoFocus();
    }
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
    }, 300);
  }

  private isSelectElement() {
    return this.el &&
      this.el.nativeElement &&
      (this.el.nativeElement.nodeName || '').toLowerCase() === 'select'
      && this.el.nativeElement.select;
  }

}
