import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { SharedComponentsModule } from './components';
import { AutoFocusDirective, TooltipDirective } from './directives';
import { OverlayComponent } from './services/overlay/overlay/overlay.component';
import { TransformUrlsDirective } from './directives/transform-urls.directive';

@NgModule({
  imports: [
    SharedImportsModule,
    SharedComponentsModule,
  ],
  declarations: [
    AutoFocusDirective,
    TooltipDirective,
    TransformUrlsDirective,
    OverlayComponent,
  ],
  exports: [
    SharedImportsModule,
    SharedComponentsModule,
    AutoFocusDirective,
    TooltipDirective,
    TransformUrlsDirective,
    OverlayComponent,
  ],
})
export class SharedModule { }
