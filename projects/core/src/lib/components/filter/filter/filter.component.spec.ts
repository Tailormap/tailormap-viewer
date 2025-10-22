import { render, screen } from '@testing-library/angular';
import { FilterComponent } from './filter.component';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { CreateFilterButtonComponent } from '../create-filter-button/create-filter-button.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectSpatialFormVisible } from '../state/filter-component.selectors';
import { ResetFiltersButtonComponent } from '../reset-filters-button/reset-filters-button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectFilterGroupsWithLayers } from '../../../state/filter-state/filter.selectors';

const setup = async (isVisible: boolean) => {
  const menubarServiceMock = {
    isComponentVisible$: jest.fn(() => of(isVisible)),
    registerComponent: jest.fn(),
    deregisterComponent: jest.fn(),
  };
  await render(FilterComponent, {
    imports: [ SharedImportsModule, MatIconModule, MatIconTestingModule ],
    declarations: [ CreateFilterButtonComponent, ResetFiltersButtonComponent ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      { provide: MenubarService, useValue: menubarServiceMock },
      provideMockStore({
        initialState: { filter: { filterGroups: [] } },
        selectors: [
          { selector: selectSpatialFormVisible, value: false },
          { selector: selectFilterGroupsWithLayers, value: [] },
        ],
      }),
    ],
  });
};

describe('FilterComponent', () => {

  test('should not render if not visible', async () => {
    await setup(false);
    expect(screen.queryByText('Filter')).not.toBeInTheDocument();
  });

  test('should render if visible', async () => {
    await setup(true);
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

});
