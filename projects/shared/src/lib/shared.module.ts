import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { SharedComponentsModule } from './components';
import { AutoFocusDirective, TooltipDirective } from './directives';
import { OverlayComponent } from './services/overlay/overlay/overlay.component';

@NgModule({
  imports: [
    SharedImportsModule,
    SharedComponentsModule,
  ],
  declarations: [
    AutoFocusDirective,
    TooltipDirective,
    OverlayComponent,
  ],
  exports: [
    SharedImportsModule,
    SharedComponentsModule,
    AutoFocusDirective,
    TooltipDirective,
    OverlayComponent,
  ],
})
export class SharedModule { }
