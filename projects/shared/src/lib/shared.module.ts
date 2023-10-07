import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { SharedComponentsModule } from './components';
import { OverlayComponent } from './services/overlay/overlay/overlay.component';
import { SharedDirectivesModule } from './directives/shared-directives.module';
import { HtmlifyPipe } from './pipes/htmlify.pipe';

// Importing CSS helper to make sure the vh/vw CSS variables are available
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CssHelper } from './helpers';

@NgModule({
  imports: [
    SharedImportsModule,
    SharedComponentsModule,
    SharedDirectivesModule,
  ],
  declarations: [
    HtmlifyPipe,
    OverlayComponent,
  ],
  exports: [
    SharedImportsModule,
    SharedComponentsModule,
    SharedDirectivesModule,
    HtmlifyPipe,
    OverlayComponent,
  ],
})
export class SharedModule { }
