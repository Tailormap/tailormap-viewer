import { NgModule } from '@angular/core';
import { DialogComponent } from './dialog';
import { SnackBarMessageComponent } from './snackbar-message';
import { SharedImportsModule } from '../shared-imports.module';
import { ErrorMessageComponent } from './error-message/error-message.component';
import { TreeComponent } from './tree';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    DialogComponent,
    SnackBarMessageComponent,
    ErrorMessageComponent,
    TreeComponent,
  ],
  imports: [
    SharedImportsModule,
    BrowserAnimationsModule,
  ],
  exports: [
    DialogComponent,
    SnackBarMessageComponent,
    ErrorMessageComponent,
    TreeComponent,
  ],
})
export class SharedComponentsModule {
}
