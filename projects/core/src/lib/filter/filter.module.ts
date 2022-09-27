import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { filterStateKey } from './state/filter.state';
import { filterReducer } from './state/filter.reducer';
import { AttributeFilterComponent } from './attribute-filter/attribute-filter.component';
import { SharedModule } from '@tailormap-viewer/shared';



@NgModule({
  declarations: [
    AttributeFilterComponent,
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature(filterStateKey, filterReducer),
    SharedModule,
  ],
  exports: [
    AttributeFilterComponent,
  ],
})
export class FilterModule { }
