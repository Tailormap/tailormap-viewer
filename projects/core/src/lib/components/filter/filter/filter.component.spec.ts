import { render, screen } from '@testing-library/angular';
import { FilterComponent } from './filter.component';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { CreateFilterButtonComponent } from '../create-filter-button/create-filter-button.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectSpatialFormVisible } from '../state/filter-component.selectors';

describe('FilterComponent', () => {

  test('should not render if not visible', async () => {
    await render(FilterComponent, {
      imports: [SharedImportsModule],
      providers: [
        provideMockStore({
          initialState: { filter: { filterGroups: [] } },
          selectors: [
            { selector: selectSpatialFormVisible, value: false },
          ],
        }),
      ],
    });
    expect(screen.queryByText('Add filter')).not.toBeInTheDocument();
  });

  test('should render if visible', async () => {
    const menubarServiceMock = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
    };
    await render(FilterComponent, {
      imports: [SharedImportsModule],
      declarations: [CreateFilterButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MenubarService, useValue: menubarServiceMock },
        provideMockStore({ initialState: { filter: { filterGroups: [] } } }),
      ],
    });
    expect(screen.getByText('Add filter')).toBeInTheDocument();
  });

});
