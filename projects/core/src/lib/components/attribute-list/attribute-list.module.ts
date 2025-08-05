import { NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { AttributeListMenuButtonComponent } from './attribute-list-menu-button/attribute-list-menu-button.component';
import { AttributeListComponent } from './attribute-list/attribute-list.component';
import { AttributeListTabComponent } from './attribute-list-tab/attribute-list-tab.component';
import { MenubarModule } from '../menubar';
import { StoreModule } from '@ngrx/store';
import { attributeListStateKey } from './state/attribute-list.state';
import { attributeListReducer } from './state/attribute-list.reducer';
import { AttributeListManagerService } from './services/attribute-list-manager.service';
import { AttributeListEffects } from './state/attribute-list.effects';
import { EffectsModule } from '@ngrx/effects';
import { AttributeListContentComponent } from './attribute-list-content/attribute-list-content.component';
import { AttributeListTableComponent } from './attribute-list-table/attribute-list-table.component';
import { AttributeListTabToolbarComponent } from './attribute-list-tab-toolbar/attribute-list-tab-toolbar.component';
import { AttributeListPagingDialogComponent } from './attribute-list-paging-dialog/attribute-list-paging-dialog.component';
import { AttributeListFilterComponent } from './attribute-list-filter/attribute-list-filter.component';
import { FilterModule } from '../../filter/filter.module';
import { AttributeListExportButtonComponent } from './attribute-list-export-button/attribute-list-export-button.component';
import { CoreSharedModule } from '../../shared';

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
  ],
  imports: [
    CommonModule,
    SharedModule,
    MenubarModule,
    StoreModule.forFeature(attributeListStateKey, attributeListReducer),
    EffectsModule.forFeature([AttributeListEffects]),
    FilterModule,
    CoreSharedModule,
  ],
  exports: [
    AttributeListComponent,
  ],
})
export class AttributeListModule {
  public constructor(
    // Service is instantiated here, watches changes to visible layers to create tabs
    //eslint-disable-next-line @typescript-eslint/prefer-inject
    public attributeListManagerService: AttributeListManagerService,
  ) {}
}
