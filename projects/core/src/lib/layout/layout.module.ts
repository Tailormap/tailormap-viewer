import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseLayoutComponent } from './base-layout/base-layout.component';
import { ComponentsModule } from '../components/components.module';
import { MapModule } from '@tailormap-viewer/map';
import {Switch3DModule} from "../components/toolbar/switch3D/switch3-d.module";



@NgModule({
  declarations: [
    BaseLayoutComponent,
  ],
    imports: [
        CommonModule,
        ComponentsModule,
        MapModule,
        Switch3DModule,
    ],
  exports: [
    BaseLayoutComponent,
  ],
})
export class LayoutModule { }
