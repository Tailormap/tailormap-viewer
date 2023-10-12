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
    BaseComponentConfigComponent,
  ],
})
export class ComponentsModule {
  constructor(
    configurationComponentService: ConfigurationComponentRegistryService,
  ) {
    /* eslint-disable max-len */
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.TOC, $localize `:@@admin-core.application.component-table-of-contents:Table of contents`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.LEGEND, $localize `:@@admin-core.application.component-legend:Legend`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.DRAWING, $localize `:@@admin-core.application.component-drawing:Drawing`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.PRINT, $localize `:@@admin-core.application.component-print:Print`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.FILTER, $localize `:@@admin-core.application.component-filter:Filter`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.ATTRIBUTE_LIST, $localize `:@@admin-core.application.component-attribute-list:Attribute list`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.EDIT, $localize `:@@admin-core.application.component-edit:Edit`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.MEASURE, $localize `:@@admin-core.application.component-measure-tools:Measure tools`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.COORDINATE_PICKER, $localize `:@@admin-core.application.component-coordinate-picker-tool:Coordinate picker tool`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.STREETVIEW, $localize `:@@admin-core.application.component-streetview-tool:Streetview tool`, BaseComponentConfigComponent);
  }
}
