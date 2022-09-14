import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { filterStateKey } from './state/filter.state';
import { filterReducer } from './state/filter.reducer';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(filterStateKey, filterReducer),
  ],
})
export class FilterModule { }
