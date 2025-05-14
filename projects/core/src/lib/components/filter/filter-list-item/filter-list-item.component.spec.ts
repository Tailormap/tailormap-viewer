import { render, screen } from '@testing-library/angular';
import { FilterListItemComponent } from './filter-list-item.component';
import { provideMockStore } from '@ngrx/store/testing';
import { getFilterGroup } from '@tailormap-viewer/shared';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { FilterDescriptionComponent } from '../../../filter/filter-description/filter-description.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('FilterListItemComponent', () => {

  test('should render list with filters', async () => {
    const filterGroup = { ...getFilterGroup(), layers: [getAppLayerModel({ title: 'The layer' })] };
    await render(FilterListItemComponent, {
      inputs: { filter: filterGroup },
      declarations: [FilterDescriptionComponent],
      providers: [provideMockStore()],
      imports: [ SharedImportsModule, MatIconTestingModule ],
    });
    expect(await screen.findByText('Attribute filter')).toBeInTheDocument();
    expect(await screen.findByText('Applies to The layer')).toBeInTheDocument();
  });

});
