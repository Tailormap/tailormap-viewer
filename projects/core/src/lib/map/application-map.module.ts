import { inject, NgModule, provideEnvironmentInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationMapService } from './services/application-map.service';
import { SharedModule } from '@tailormap-viewer/shared';
import { MapSpinnerComponent } from './components/map-spinner/map-spinner.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
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
