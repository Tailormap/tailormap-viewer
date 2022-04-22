import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MouseCoordinatesComponent } from './mouse-coordinates.component';

@NgModule({
  declarations: [
    MouseCoordinatesComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    MouseCoordinatesComponent,
  ],
})
export class MouseCoordinatesModule {
}
