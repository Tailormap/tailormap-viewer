import { NgModule } from '@angular/core';
import { DialogComponent } from './dialog';
import { SnackBarMessageComponent } from './snackbar-message';
import { SharedImportsModule } from '../shared-imports.module';
import { ErrorMessageComponent } from './error-message/error-message.component';
import { TreeComponent } from './tree';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SplitButtonComponent } from './split-button/split-button.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { IconPickerComponent } from './icon-picker/icon-picker.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [
    DialogComponent,
    SnackBarMessageComponent,
    ErrorMessageComponent,
    TreeComponent,
    SplitButtonComponent,
    ColorPickerComponent,
    IconPickerComponent,
    ConfirmDialogComponent,
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
    SplitButtonComponent,
    ColorPickerComponent,
    IconPickerComponent,
  ],
})
export class SharedComponentsModule {
}
