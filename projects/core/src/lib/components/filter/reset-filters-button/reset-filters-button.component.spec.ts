import { render, screen } from '@testing-library/angular';
import { ResetFiltersButtonComponent } from './reset-filters-button.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { selectFilterGroupsWithLayers } from '../../../state/filter-state/filter.selectors';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { MatIconModule } from '@angular/material/icon';

describe('ResetFiltersButtonComponent', () => {

  test('should render', async () => {
    await render(ResetFiltersButtonComponent, {
      imports: [ MatMenuModule, MatButtonModule, MatIconModule, MatIconTestingModule ],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectFilterGroupsWithLayers,
              value: [{
                id: '1',
                source: 'PRESET',
                layers: [{ id: 'layer1', title: 'Layer 1', visible: true }],
                layerIds: ['layer1'],
                filters: [
                  { id: 'filter1', attribute: 'attr1', operator: 'EQUALS', value: 'value1' },
                ],
                type: FilterTypeEnum.ATTRIBUTE,
                operator: 'AND',
              }],
            },
          ],
        }),
      ],
    });
    expect(screen.getByText('Reset filters'));
  });

});
