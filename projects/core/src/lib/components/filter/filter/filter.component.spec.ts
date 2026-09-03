import { render, screen } from '@testing-library/angular';
import { FilterComponent } from './filter.component';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectSpatialFormVisible } from '../state/filter-component.selectors';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectFilterGroupsWithLayers } from '../../../state/filter-state/filter.selectors';

const setup = async (isVisible: boolean) => {
  const menubarServiceMock = {
    isComponentVisible$: vi.fn(() => of(isVisible)),
    registerComponent: vi.fn(),
    deregisterComponent: vi.fn(),
    setMobilePanelHeight: vi.fn(),
  };
  await render(FilterComponent, {
    imports: [ MatIconModule, MatIconTestingModule ],
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
    expect(screen.queryByText('Spatial filter')).not.toBeInTheDocument();
  });

  test('should render if visible', async () => {
    await setup(true);
    expect(screen.getByText('Spatial filter')).toBeInTheDocument();
  });

});
