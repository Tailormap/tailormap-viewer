import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintMenuButtonComponent } from './print-menu-button/print-menu-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { PrintComponent } from './print/print.component';

@NgModule({
    exports: [
        PrintComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        MenubarModule,
        PrintMenuButtonComponent,
        PrintComponent,
    ],
})
export class PrintModule { }
