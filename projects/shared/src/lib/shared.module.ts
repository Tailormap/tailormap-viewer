import { NgModule } from '@angular/core';
import { SharedImportsModule } from './shared-imports.module';
import { DialogComponent } from './components/dialog';
import { SnackBarMessageComponent } from './components/snackbar-message/snack-bar-message.component';

@NgModule({
  declarations: [
    DialogComponent,
    SnackBarMessageComponent,
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    DialogComponent,
    SharedImportsModule,
    SnackBarMessageComponent,
  ],
})
export class SharedModule { }
