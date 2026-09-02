import { Directive, HostBinding, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({ selector: '[tmTooltip]', })
export class TooltipDirective extends MatTooltip {

  private _explicitAriaLabel: string | null = null;

  @Input('tmTooltip')
  public set tooltip(tooltip: string | null) {
    if (tooltip) {
      this.message = tooltip;
    }
  }

  // Allow explicitly setting an aria-label that is different from the tooltip.
  @Input()
  public set tmExplicitAriaLabel(ariaLabel: string | null) {
    if (ariaLabel) {
      this._explicitAriaLabel = ariaLabel;
    }
  }

  @HostBinding('attr.aria-label')
  public get ariaLabel() {
    return this._explicitAriaLabel || this.message;
  }

}
