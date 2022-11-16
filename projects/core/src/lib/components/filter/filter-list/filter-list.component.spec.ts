import { render, screen } from '@testing-library/angular';
import { FilterListComponent } from './filter-list.component';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { getFilterGroup } from '../../../filter/helpers/attribute-filter.helper.spec';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { FilterListItemComponent } from '../filter-list-item/filter-list-item.component';
import { selectFilterGroupsWithLayers } from '../../../filter/state/filter.selectors';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FilterDescriptionComponent } from '../../../filter/filter-description/filter-description.component';

describe('FilterListComponent', () => {

  test('should render empty list', async () => {
    const store = provideMockStore({ initialState: { filter: { filterGroups: [] } } });
    await render(FilterListComponent, {
      providers: [store],
      imports: [SharedImportsModule],
    });
    expect(screen.queryByText('Attribute filter')).not.toBeInTheDocument();
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
      declarations: [ FilterListItemComponent, FilterDescriptionComponent ],
      imports: [ SharedImportsModule, MatIconTestingModule ],
    });
    expect(await screen.findByText('Attribute filter')).toBeInTheDocument();
    expect(await screen.findByText('Applies to The layer')).toBeInTheDocument();
  });

});
