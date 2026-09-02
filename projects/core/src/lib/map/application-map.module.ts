import { inject, NgModule, provideEnvironmentInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationMapService } from './services/application-map.service';

import { MapSpinnerComponent } from './components/map-spinner/map-spinner.component';

@NgModule({
    imports: [
    CommonModule,
    MapSpinnerComponent,
],
    exports: [
        MapSpinnerComponent,
    ],
    providers: [
        provideEnvironmentInitializer(() => {
            inject(ApplicationMapService).init();
        }),
    ],
})
export class ApplicationMapModule {
}
