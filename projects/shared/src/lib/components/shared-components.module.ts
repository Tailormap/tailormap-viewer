import { NgModule } from '@angular/core';
import { DialogComponent } from './dialog';
import { SnackBarMessageComponent } from './snackbar-message';
import { SharedImportsModule } from '../shared-imports.module';
import { ErrorMessageComponent } from './error-message/error-message.component';
import { TreeComponent } from './tree';
import { TreeNodeLayerComponent } from './tree-node-layer';

@NgModule({
  declarations: [
    DialogComponent,
    SnackBarMessageComponent,
    ErrorMessageComponent,
    TreeComponent,
    TreeNodeLayerComponent,
  ],
  imports: [
    SharedImportsModule,
  ],
  exports: [
    DialogComponent,
    SnackBarMessageComponent,
    ErrorMessageComponent,
    TreeComponent,
    TreeNodeLayerComponent,
  ],
})
export class SharedComponentsModule {
}
