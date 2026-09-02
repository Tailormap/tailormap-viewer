import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { InfoComponent } from './info/info.component';
import { InfoMenuButtonComponent } from './info-menu-button/info-menu-button.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        MenubarModule,
        InfoComponent,
        InfoMenuButtonComponent,
    ],
    exports: [
        InfoComponent,
    ],
})
export class InfoModule { }
