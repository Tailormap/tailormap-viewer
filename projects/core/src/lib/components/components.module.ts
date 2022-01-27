import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureInfoModule } from './feature-info/feature-info.module';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FeatureInfoModule,
  ],
  exports: [
    FeatureInfoModule,
  ],
})
export class ComponentsModule { }
