import { NgModule } from '@angular/core';
import { ViewerAppComponent } from './pages';
import { MapModule } from '@tailormap-viewer/map';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../../../app/src/environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { coreReducer } from './state/core.reducer';


@NgModule({
  declarations: [
    ViewerAppComponent,
  ],
  imports: [
    StoreModule.forRoot({
      core: coreReducer,
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
    EffectsModule.forRoot([]),
    MapModule,
  ],
  exports: [
    ViewerAppComponent,
  ],
})
export class CoreModule { }
