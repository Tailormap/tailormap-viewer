import { NgModule, inject, provideEnvironmentInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { provideState } from '@ngrx/store';
import { searchIndexStateKey } from './state/search-index.state';
import { searchIndexReducer } from './state/search-index.reducer';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
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
import { MatTimepicker, MatTimepickerInput, MatTimepickerToggle } from '@angular/material/timepicker';

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
    SharedAdminComponentsModule,
    CatalogModule,
    FormModule,
    MatTimepickerToggle,
    MatTimepicker,
    MatTimepickerInput,
  ],
  exports: [
    SearchIndexListComponent,
  ],
  providers: [
    provideState(searchIndexStateKey, searchIndexReducer),
    provideEnvironmentInitializer(() => inject(SearchIndexService).listenForSearchIndexChanges()),
  ],
})
export class SearchIndexModule {
}
