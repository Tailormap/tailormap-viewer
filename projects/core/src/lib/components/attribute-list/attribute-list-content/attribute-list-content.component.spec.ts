import { render, screen } from '@testing-library/angular';
import { getLoadedStoreNoRows, getLoadedStoreWithRows, getLoadingStore } from '../state/mocks/attribute-list-state-test-data';
import { AttributeListContentComponent } from './attribute-list-content.component';
import { provideMockStore } from '@ngrx/store/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttributeListTableComponent } from '../attribute-list-table/attribute-list-table.component';
import { MatTableModule } from '@angular/material/table';
import { PanelResizerComponent } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';

describe('AttributeListContent', () => {

  it('renders content, loading, no rows', async () => {
    const store = getLoadingStore();
    await render(AttributeListContentComponent, {
      imports: [ MatProgressSpinnerModule ],
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  it('renders content, not loading, no rows', async () => {
    const store = getLoadedStoreNoRows();
    await render(AttributeListContentComponent, {
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.findByText('No rows found')).toBeInTheDocument();
  });

  it('renders content, loaded and with rows', async () => {
    const store = getLoadedStoreWithRows();
    await render(AttributeListContentComponent, {
      imports: [ MatTableModule, MatIconModule, MatIconTestingModule ],
      declarations: [ AttributeListContentComponent, AttributeListTableComponent, PanelResizerComponent ],
      providers: [
        provideMockStore({
          initialState: store,
        }),
      ],
    });
    expect(await screen.findByText('Attribute 1')).toBeInTheDocument();
    expect(await screen.findByText('1: Test')).toBeInTheDocument();
    expect(await screen.findByText('10: Test')).toBeInTheDocument();
  });

});
