import { render, screen } from '@testing-library/angular';
import { FilterListComponent } from './filter-list.component';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { getFilterGroup } from '../../../../../../shared/src/lib/helpers/attribute-filter.helper.spec';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { FilterListItemComponent } from '../filter-list-item/filter-list-item.component';
import { selectFilterGroupsWithLayers } from '../../../filter/state/filter.selectors';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FilterDescriptionComponent } from '../../../filter/filter-description/filter-description.component';
import { AttributeFilterService } from '../../../services/attribute-filter.service';
import { of } from 'rxjs';

describe('FilterListComponent', () => {

  test('should render empty list', async () => {
    const mockAttributeFilterService = {
      addAttributeAliasesToFilters$: jest.fn().mockImplementation((filterGroups) => of(filterGroups)),
    };
    await render(FilterListComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      declarations: [ FilterListItemComponent, FilterDescriptionComponent ],
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
        { provide: AttributeFilterService, useValue: mockAttributeFilterService },
      ],
    });
    expect(screen.queryByText('Attribute filter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-list-item')).toBeNull();
  });

  test('should render list with filters', async () => {
    const mockAttributeFilterService = {
      addAttributeAliasesToFilters$: jest.fn().mockImplementation((filterGroups) => of(filterGroups)),
    };
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
      providers: [
        store,
        { provide: AttributeFilterService, useValue: mockAttributeFilterService },
      ],
      declarations: [ FilterListItemComponent, FilterDescriptionComponent ],
      imports: [ SharedImportsModule, MatIconTestingModule ],
    });
    expect(await screen.findByText('Applies to The layer')).toBeInTheDocument();
  });

});
