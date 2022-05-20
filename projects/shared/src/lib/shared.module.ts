import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { SharedComponentsModule } from './components';
import { AutoFocusDirective } from './directives';
import { OverlayComponent } from './services/overlay/overlay/overlay.component';

@NgModule({
  imports: [
    SharedImportsModule,
    SharedComponentsModule,
  ],
  declarations: [
    AutoFocusDirective,
    OverlayComponent,
  ],
  exports: [
    SharedImportsModule,
    SharedComponentsModule,
    AutoFocusDirective,
    OverlayComponent,
  ],
})
export class SharedModule { }
