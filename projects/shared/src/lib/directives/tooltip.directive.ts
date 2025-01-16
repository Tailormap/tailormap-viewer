import { Directive, HostBinding, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[tmTooltip]',
  standalone: false,
})
export class TooltipDirective extends MatTooltip {

  @Input('tmTooltip')
  public set tooltip(tooltip: string | null) {
    if (tooltip) {
      this.message = tooltip;
    }
  }

  @HostBinding('attr.aria-label')
  public get ariaLabel() {
    return this.message;
  }

}
