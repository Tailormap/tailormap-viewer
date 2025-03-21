import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseLayoutComponent } from './base-layout/base-layout.component';
import { ComponentsModule } from '../components/components.module';
import { MapModule } from '@tailormap-viewer/map';
import { EmbeddedLayoutComponent } from './embedded-layout/embedded-layout.component';
import { ShareViewerModule } from '../components/toolbar/share-viewer/share-viewer.module';
import { Switch3DModule } from "../components/toolbar/switch3D/switch3-d.module";



@NgModule({
  declarations: [
    BaseLayoutComponent,
    EmbeddedLayoutComponent,
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    MapModule,
    ShareViewerModule,
    Switch3DModule,
  ],
  exports: [
    BaseLayoutComponent,
    EmbeddedLayoutComponent,
  ],
})
export class LayoutModule { }
