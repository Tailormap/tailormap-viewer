import { createComponentFactory, createSpyObject, Spectator } from '@ngneat/spectator';
import { AttributeListFilterComponent, FilterDialogData } from './attribute-list-filter.component';
import { SharedModule } from '@tailormap/shared';
import { attributeListStateKey, initialAttributeListState } from '../state/attribute-list.state';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getMetadataServiceMockProvider } from '@tailormap/testing-utilities';
import { AttributeTypeEnum } from '@tailormap/api';
import { AttributeFilterComponent } from '../../shared';

describe('AttributeListFilterComponent', () => {

  let spectator: Spectator<AttributeListFilterComponent>;
  const initialState = { [attributeListStateKey]: initialAttributeListState };
  let store: MockStore;

  const dialogRef: MatDialogRef<AttributeListFilterComponent> = createSpyObject(MatDialogRef);
  const dialogData: FilterDialogData = {
    columnName: 'col',
    dataId: '1',
    featureType: 1,
    filter: null,
    layerId: '1',
    columnType: AttributeTypeEnum.STRING,
    dataSource: 'api',
  };

  const createComponent = createComponentFactory({
    component: AttributeListFilterComponent,
    declarations: [
      AttributeFilterComponent,
    ],
    imports: [ SharedModule ],
    providers: [
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      provideMockStore({ initialState }),
      getMetadataServiceMockProvider(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
