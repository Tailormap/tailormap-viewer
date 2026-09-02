import { render, screen } from '@testing-library/angular';
import { FilterListComponent } from './filter-list.component';
import { provideMockStore } from '@ngrx/store/testing';
import { getFilterGroup } from '../../../../../../shared/src/lib/helpers/attribute-filter.mock';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { selectFilterGroupsWithLayers } from '../../../state/filter-state/filter.selectors';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('FilterListComponent', () => {

  test('should render empty list', async () => {
    await render(FilterListComponent, {
      imports: [MatIconTestingModule],
      providers: [
        provideMockStore({
          initialState: {
            filter: {
              filterGroups: [],
            },
          },
          selectors: [
            {
              selector: selectFilterGroupsWithLayers,
              value: [],
            },
          ],
        }),
      ],
    });
    expect(screen.queryByText('Attribute filter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-list-item')).toBeNull();
  });

  test('should render list with filters', async () => {
    const store = provideMockStore({
      initialState: {},
      selectors: [
        {
          selector: selectFilterGroupsWithLayers,
          value: [
            { ...getFilterGroup(), layers: [getAppLayerModel({ title: 'The layer' })] },
          ],
        },
      ],
    });
    await render(FilterListComponent, {
      providers: [store],
      imports: [MatIconTestingModule],
    });
    expect(await screen.findByText('Applies to The layer')).toBeInTheDocument();
  });

});
