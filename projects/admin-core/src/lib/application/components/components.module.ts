import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponentConfigComponent } from './base-component-config/base-component-config.component';
import { ComponentConfigRendererComponent } from './component-config-renderer/component-config-renderer.component';
import { ComponentsListComponent } from './components-list/components-list.component';
import { ConfigurationComponentRegistryService } from '../services/configuration-component-registry.service';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { SharedModule } from '@tailormap-viewer/shared';



@NgModule({
  declarations: [
    BaseComponentConfigComponent,
    ComponentConfigRendererComponent,
    ComponentsListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports: [
    ComponentsListComponent,
    ComponentConfigRendererComponent,
  ],
})
export class ComponentsModule {
  constructor(
    configurationComponentService: ConfigurationComponentRegistryService,
  ) {
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.TOC, $localize `Table of contents`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.LEGEND, $localize `Legend`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.DRAWING, $localize `Drawing`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.PRINT, $localize `Print`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.FILTER, $localize `Filter`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.ATTRIBUTE_LIST, $localize `Attribute list`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.MEASURE, $localize `Measure tools`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.COORDINATE_PICKER, $localize `Coordinate picker tool`, BaseComponentConfigComponent);
  }
}
