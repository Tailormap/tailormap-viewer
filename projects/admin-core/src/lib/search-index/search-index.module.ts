import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { StoreModule } from '@ngrx/store';
import { searchIndexStateKey } from './state/search-index.state';
import { searchIndexReducer } from './state/search-index.reducer';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { EffectsModule } from '@ngrx/effects';
import { SearchIndexEffects } from './state/search-index.effects';
import { SearchIndexHomeComponent } from './search-index-home/search-index-home.component';
import { SearchIndexEditComponent } from './search-index-edit/search-index-edit.component';
import { SearchIndexCreateComponent } from './search-index-create/search-index-create.component';
import { SearchIndexListComponent } from './search-index-list/search-index-list.component';
import { SearchIndexFormComponent } from './search-index-form/search-index-form.component';
import { CatalogModule } from '../catalog/catalog.module';
import { FormModule } from '../form/form.module';
import { SearchIndexService } from './services/search-index.service';
import { SearchIndexAttributeListComponent } from './search-index-attribute-list/search-index-attribute-list.component';
import { SearchIndexSchedulingComponent } from './search-index-scheduling/search-index-scheduling.component';

@NgModule({
  declarations: [
    SearchIndexListComponent,
    SearchIndexHomeComponent,
    SearchIndexEditComponent,
    SearchIndexCreateComponent,
    SearchIndexFormComponent,
    SearchIndexAttributeListComponent,
    SearchIndexSchedulingComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature(searchIndexStateKey, searchIndexReducer),
    EffectsModule.forFeature([SearchIndexEffects]),
    SharedAdminComponentsModule,
    CatalogModule,
    FormModule,
  ],
  exports: [
    SearchIndexListComponent,
  ],
})
export class SearchIndexModule {
  constructor(searchIndexService: SearchIndexService) {
    searchIndexService.listenForSearchIndexChanges();
  }
}
