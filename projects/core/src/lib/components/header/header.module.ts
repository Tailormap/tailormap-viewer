import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { MenubarModule } from '../menubar';
import { HeaderComponent } from './header/header.component';
import {CoreSharedModule} from "../../shared";

@NgModule({
  declarations: [
    HeaderComponent,
  ],
    imports: [
        CommonModule,
        SharedModule,
        MenubarModule,
        CoreSharedModule,
    ],
  exports: [
    HeaderComponent,
  ],
})
export class HeaderModule { }
