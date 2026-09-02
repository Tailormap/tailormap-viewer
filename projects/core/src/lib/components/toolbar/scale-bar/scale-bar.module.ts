import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScaleBarComponent } from './scale-bar.component';



@NgModule({
    imports: [
        CommonModule,
        ScaleBarComponent,
    ],
    exports: [
        ScaleBarComponent,
    ],
})
export class ScaleBarModule { }
