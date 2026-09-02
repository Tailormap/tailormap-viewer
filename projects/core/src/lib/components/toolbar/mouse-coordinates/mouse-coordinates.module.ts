import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MouseCoordinatesComponent } from './mouse-coordinates.component';

@NgModule({
    imports: [
        CommonModule,
        MouseCoordinatesComponent,
    ],
    exports: [
        MouseCoordinatesComponent,
    ],
})
export class MouseCoordinatesModule {
}
