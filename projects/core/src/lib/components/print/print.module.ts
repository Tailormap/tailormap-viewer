import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintMenuButtonComponent } from './print-menu-button/print-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { PrintComponent } from './print/print.component';

@NgModule({
  declarations: [
    PrintMenuButtonComponent,
    PrintComponent,
  ],
  exports: [
    PrintComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
  ],
})
export class PrintModule { }
