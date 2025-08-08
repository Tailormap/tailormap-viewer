import { NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponentConfigComponent } from './base-component-config/base-component-config.component';
import { ComponentConfigRendererComponent } from './component-config-renderer/component-config-renderer.component';
import { ComponentsListComponent } from './components-list/components-list.component';
import { ConfigurationComponentRegistryService } from '../services/configuration-component-registry.service';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { MarkdownEditorComponent, SharedModule } from '@tailormap-viewer/shared';
import { MeasureComponentConfigComponent } from './measure-config/measure-component-config.component';
import { CoordinateLinkWindowComponentConfigComponent } from './coordinate-link-window-config/coordinate-link-window-component-config.component';
import { FeatureInfoComponentConfigComponent } from './feature-info-config/feature-info-component-config.component';
import { SimpleSearchComponentConfigComponent } from './simple-search-config/simple-search-component-config.component';
import { HeaderComponentConfigComponent } from './header-config/header-component-config.component';
import { SelectUploadModule } from '../../shared/components/select-upload/select-upload.module';
import { EditComponentConfigComponent } from './edit-config/edit-component-config.component';
import { GeolocationConfigComponent } from './geolocation-config/geolocation-config.component';
import { InfoConfigComponent } from './info-config/info-config.component';

@NgModule({
  declarations: [
    ComponentConfigRendererComponent,
    ComponentsListComponent,
    MeasureComponentConfigComponent,
    CoordinateLinkWindowComponentConfigComponent,
    FeatureInfoComponentConfigComponent,
    SimpleSearchComponentConfigComponent,
    HeaderComponentConfigComponent,
    EditComponentConfigComponent,
    GeolocationConfigComponent,
    InfoConfigComponent,
  ],
    imports: [
        CommonModule,
        SharedModule,
        BaseComponentConfigComponent,
        SelectUploadModule,
        MarkdownEditorComponent,
    ],
  exports: [
    ComponentsListComponent,
    ComponentConfigRendererComponent,
  ],
})
export class ComponentsModule {
  constructor() {
    const configurationComponentService = inject(ConfigurationComponentRegistryService);

    /* eslint-disable max-len */
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.TOC, $localize `:@@admin-core.application.component-table-of-contents:Table of contents`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.LEGEND, $localize `:@@admin-core.application.component-legend:Legend`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.DRAWING, $localize `:@@admin-core.application.component-drawing:Drawing`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.PRINT, $localize `:@@admin-core.application.component-print:Print`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.FILTER, $localize `:@@admin-core.application.component-filter:Filter`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.FEATURE_INFO, $localize `:@@admin-core.application.component-feature-info:Feature info`, FeatureInfoComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.ATTRIBUTE_LIST, $localize `:@@admin-core.application.component-attribute-list:Attribute list`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.EDIT, $localize `:@@admin-core.application.component-edit:Edit`, EditComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.MEASURE, $localize `:@@admin-core.application.component-measure-tools:Measure tools`, MeasureComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.COORDINATE_PICKER, $localize `:@@admin-core.application.component-coordinate-picker-tool:Coordinate picker tool`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.STREETVIEW, $localize `:@@admin-core.application.component-streetview-tool:Streetview tool`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.SHARE_VIEWER, $localize `:@@admin-core.application.component-share-viewer:Share viewer`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.COORDINATE_LINK_WINDOW, $localize `:@@admin-core.application.component-coordinate-link-window:Coordinate Link Window`, CoordinateLinkWindowComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.SIMPLE_SEARCH, $localize `:@@admin-core.application.component-simple-search:Search`, SimpleSearchComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.TERRAIN_LAYER_TOGGLE, $localize `:@@admin-core.application.component-terrain-layer-toggle:Terrain layer toggle`, BaseComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.HEADER, $localize `:@@admin-core.application.component-header:Header`, HeaderComponentConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.GEOLOCATION, $localize `:@@admin-core.application.component-geolocation:Geolocation`, GeolocationConfigComponent);
    configurationComponentService.registerConfigurationComponents(BaseComponentTypeEnum.INFO, $localize `:@@admin-core.application.component-info:Info`, InfoConfigComponent);
  }
}
