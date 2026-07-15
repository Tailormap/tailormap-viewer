import { NgModule, provideEnvironmentInitializer, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { AttributeListMenuButtonComponent } from './attribute-list-menu-button/attribute-list-menu-button.component';
import { AttributeListComponent } from './attribute-list/attribute-list.component';
import { AttributeListTabComponent } from './attribute-list-tab/attribute-list-tab.component';
import { MenubarModule } from '../menubar';
import { AttributeListContentComponent } from './attribute-list-content/attribute-list-content.component';
import { AttributeListTableComponent } from './attribute-list-table/attribute-list-table.component';
import { AttributeListTabToolbarComponent } from './attribute-list-tab-toolbar/attribute-list-tab-toolbar.component';
import { AttributeListPagingDialogComponent } from './attribute-list-paging-dialog/attribute-list-paging-dialog.component';
import { AttributeListFilterComponent } from './attribute-list-filter/attribute-list-filter.component';
import { FilterModule } from '../../filter/filter.module';
import { AttributeListExportButtonComponent } from './attribute-list-export-button/attribute-list-export-button.component';
import { CoreSharedModule } from '../../shared';
import { AttributeListFeatureDetailsComponent } from './attribute-list-feature-details/attribute-list-feature-details.component';
import { AttributeListApiService } from './services/attribute-list-api.service';
import { AttributeListColumnSelectionComponent } from './attribute-list-column-selection/attribute-list-column-selection.component';
import { provideState } from '@ngrx/store';
import { attributeListStateKey } from './state/attribute-list.state';
import { attributeListReducer } from './state/attribute-list.reducer';

@NgModule({
  declarations: [
    AttributeListComponent,
    AttributeListMenuButtonComponent,
    AttributeListTabComponent,
    AttributeListTabToolbarComponent,
    AttributeListContentComponent,
    AttributeListTableComponent,
    AttributeListPagingDialogComponent,
    AttributeListFilterComponent,
    AttributeListExportButtonComponent,
    AttributeListFeatureDetailsComponent,
    AttributeListColumnSelectionComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    FilterModule,
    CoreSharedModule,
  ],
  exports: [
    AttributeListComponent,
  ],
  providers: [
    provideState(attributeListStateKey, attributeListReducer),
    // Watches changes to visible layers to create tabs; must run after `provideState` above since it
    // needs `attributeListStateKey` to already be registered.
    provideEnvironmentInitializer(() => inject(AttributeListApiService).initDefaultAttributeListSource()),
  ],
})
export class AttributeListModule {
}
