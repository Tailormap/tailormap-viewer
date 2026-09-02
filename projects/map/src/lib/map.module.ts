import { NgModule } from '@angular/core';
import { MapComponent } from './map/map.component';



@NgModule({
    imports: [
        MapComponent
    ],
    exports: [
        MapComponent,
    ],
})
export class MapModule { }
