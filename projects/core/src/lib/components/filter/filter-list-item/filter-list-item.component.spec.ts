import { render, screen } from '@testing-library/angular';
import { FilterListItemComponent } from './filter-list-item.component';
import { provideMockStore } from '@ngrx/store/testing';
import { getFilterGroup } from '../../../../../../shared/src/lib/helpers/attribute-filter.mock';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('FilterListItemComponent', () => {

  test('should render list with filters', async () => {
    const filterGroup = { ...getFilterGroup(), layers: [getAppLayerModel({ title: 'The layer' })] };
    await render(FilterListItemComponent, {
      inputs: { filterGroup: filterGroup },
      providers: [provideMockStore()],
      imports: [MatIconTestingModule],
    });
    expect(await screen.findByText('Applies to The layer')).toBeInTheDocument();
  });

});
