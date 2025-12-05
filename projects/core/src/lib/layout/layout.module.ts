import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseLayoutComponent } from './base-layout/base-layout.component';
import { ComponentsModule } from '../components/components.module';
import { MapModule } from '@tailormap-viewer/map';
import { EmbeddedLayoutComponent } from './embedded-layout/embedded-layout.component';
import { ShareViewerModule } from '../components/toolbar/share-viewer/share-viewer.module';
import { Switch3dModule } from "../components/toolbar/switch3d/switch3d.module";
import { MobileLayoutComponent } from './mobile-layout/mobile-layout.component';



@NgModule({
  declarations: [
    BaseLayoutComponent,
    EmbeddedLayoutComponent,
    MobileLayoutComponent,
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    MapModule,
    ShareViewerModule,
    Switch3dModule,
  ],
    exports: [
        BaseLayoutComponent,
        EmbeddedLayoutComponent,
        MobileLayoutComponent,
    ],
})
export class LayoutModule { }
