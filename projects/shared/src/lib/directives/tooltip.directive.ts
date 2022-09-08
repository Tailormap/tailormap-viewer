import { Directive, HostBinding, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[tmTooltip]',
})
export class TooltipDirective extends MatTooltip {

  @Input('tmTooltip')
  public set tooltip(tooltip: string) {
    this.message = tooltip;
  }

  @HostBinding('attr.aria-label')
  public get ariaLabel() {
    return this.message;
  }

}
