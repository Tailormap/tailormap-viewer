import { NgModule } from '@angular/core';
import { SharedModule } from '@tailormap-viewer/shared';
import { RegisteredComponentsModule } from '../registered-components-renderer/registered-components.module';
import { MatBadge } from '@angular/material/badge';
import { MobileMenubarBottomComponent } from './mobile-menubar-bottom.component';
import { CoreSharedModule } from '../../shared/core-shared.module';

@NgModule({
  declarations: [
    MobileMenubarBottomComponent,
  ],
  imports: [
    SharedModule,
    RegisteredComponentsModule,
    CoreSharedModule,
    MatBadge,
  ],
  exports: [
    MobileMenubarBottomComponent,
  ],
})
export class MobileMenubarBottomModule { }
