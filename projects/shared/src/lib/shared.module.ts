import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { SharedComponentsModule } from './components';
import { AutoFocusDirective, TooltipDirective } from './directives';
import { OverlayComponent } from './services/overlay/overlay/overlay.component';
import { HtmlifyPipe } from './pipes/htmlify.pipe';

// Importing CSS helper to make sure the vh/vw CSS variables are available
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CssHelper } from './helpers';

@NgModule({
  imports: [
    SharedImportsModule,
    SharedComponentsModule,
  ],
  declarations: [
    AutoFocusDirective,
    TooltipDirective,
    HtmlifyPipe,
    OverlayComponent,
  ],
  exports: [
    SharedImportsModule,
    SharedComponentsModule,
    AutoFocusDirective,
    TooltipDirective,
    HtmlifyPipe,
    OverlayComponent,
  ],
})
export class SharedModule { }
