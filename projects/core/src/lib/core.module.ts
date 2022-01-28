import { NgModule } from '@angular/core';
import { ViewerAppComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../../../app/src/environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { coreReducer } from './state/core.reducer';
import { coreStateKey } from './state/core.state';
import { CoreEffects } from './state/core.effects';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1Service } from '@tailormap-viewer/api';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { ApplicationMapService } from './services/application-map.service';
import { ComponentsModule } from './components/components.module';


@NgModule({
  declarations: [
    ViewerAppComponent,
  ],
  imports: [
    StoreModule.forRoot({
      [coreStateKey]: coreReducer,
    }, {
      runtimeChecks: {
        strictActionImmutability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictStateImmutability: true,
        strictStateSerializability: true,
        strictActionTypeUniqueness: true,
      },
    }),
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
    EffectsModule.forRoot([ CoreEffects ]),
    MapModule,
    SharedImportsModule,
    ComponentsModule,
  ],
  exports: [
    ViewerAppComponent,
  ],
  providers: [
    { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1Service },
  ],
})
export class CoreModule {
  constructor(
    _applicationMapService: ApplicationMapService,
  ) {
  }
}
