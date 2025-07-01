import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterComponent } from './filter/filter.component';
import { FilterMenuButtonComponent } from './filter-menu-button/filter-menu-button.component';
import { MenubarModule } from '../menubar';
import { CreateFilterButtonComponent } from './create-filter-button/create-filter-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { FilterListComponent } from './filter-list/filter-list.component';
import { FilterListItemComponent } from './filter-list-item/filter-list-item.component';
import { FilterModule } from '../../filter/filter.module';
import { SpatialFilterFormComponent } from './spatial-filter-form/spatial-filter-form.component';
import { ApplicationMapModule } from '../../map/application-map.module';
import { StoreModule } from '@ngrx/store';
import { filterComponentStateKey } from './state/filter-component.state';
import { filterComponentReducer } from './state/filter-component.reducer';
import { SpatialFilterFormSelectLayersComponent } from './spatial-filter-form-select-layers/spatial-filter-form-select-layers.component';
import { SpatialFilterFormDrawGeometriesComponent } from './spatial-filter-form-draw-geometries/spatial-filter-form-draw-geometries.component';
import { SpatialFilterFormBufferComponent } from './spatial-filter-form-buffer/spatial-filter-form-buffer.component';
import {
  SpatialFilterFormSelectReferenceLayerComponent,
} from './spatial-filter-form-select-reference-layer/spatial-filter-form-select-reference-layer.component';
import { EditAttributeFiltersComponent } from './edit-attribute-filters/edit-attribute-filters.component';
import { SliderFilterComponent } from './slider-filter/slider-filter.component';
import { CheckboxFilterComponent } from './checkbox-filter/checkbox-filter.component';
import { SwitchFilterComponent } from './switch-filter/switch-filter.component';
import { DatePickerFilterComponent } from './date-picker-filter/date-picker-filter.component';



@NgModule({
  declarations: [
    FilterComponent,
    FilterMenuButtonComponent,
    CreateFilterButtonComponent,
    FilterListComponent,
    FilterListItemComponent,
    SpatialFilterFormComponent,
    SpatialFilterFormSelectLayersComponent,
    SpatialFilterFormDrawGeometriesComponent,
    SpatialFilterFormBufferComponent,
    SpatialFilterFormSelectReferenceLayerComponent,
    EditAttributeFiltersComponent,
    SliderFilterComponent,
    CheckboxFilterComponent,
    SwitchFilterComponent,
    DatePickerFilterComponent,
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature(filterComponentStateKey, filterComponentReducer),
    MenubarModule,
    SharedModule,
    FilterModule,
    ApplicationMapModule,
  ],
  exports: [
    FilterComponent,
  ],
})
export class FilterComponentModule { }
