import { NgModule } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';
import { AutoFocusDirective } from './auto-focus.directive';
import { CancelCloseButtonDirective } from './cancel-close-button.directive';


@NgModule({
  declarations: [
    AutoFocusDirective,
    TooltipDirective,
    CancelCloseButtonDirective,
  ],
  exports: [
    AutoFocusDirective,
    TooltipDirective,
    CancelCloseButtonDirective,
  ],
})
export class SharedDirectivesModule {
}
