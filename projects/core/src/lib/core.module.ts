import { NgModule } from '@angular/core';
import { HomeComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';


@NgModule({
  declarations: [
    HomeComponent,
  ],
  imports: [
    MapModule,
  ],
  exports: [
    HomeComponent,
  ],
})
export class CoreModule { }
