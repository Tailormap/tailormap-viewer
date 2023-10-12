import { NgModule } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';
import { AutoFocusDirective } from './auto-focus.directive';


@NgModule({
  declarations: [
    AutoFocusDirective,
    TooltipDirective,
  ],
  exports: [
    AutoFocusDirective,
    TooltipDirective,
  ],
})
export class SharedDirectivesModule {
}
