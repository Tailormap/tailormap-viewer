import { render, screen } from '@testing-library/angular';
import { FilterListItemComponent } from './filter-list-item.component';
import { provideMockStore } from '@ngrx/store/testing';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { getFilterGroup } from '@tailormap-viewer/shared';

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
