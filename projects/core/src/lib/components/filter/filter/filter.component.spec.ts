import { render, screen } from '@testing-library/angular';
import { FilterComponent } from './filter.component';
import { provideMockStore } from '@ngrx/store/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MenubarService } from '../../menubar';
import { of } from 'rxjs';
import { CreateFilterButtonComponent } from '../create-filter-button/create-filter-button.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectSpatialFormVisible } from '../state/filter-component.selectors';

const setup = async (isVisible: boolean) => {
  const menubarServiceMock = {
    isComponentVisible$: jest.fn(() => of(isVisible)),
    registerComponent: jest.fn(),
    deregisterComponent: jest.fn(),
  };
  await render(FilterComponent, {
    imports: [SharedImportsModule],
    declarations: [CreateFilterButtonComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      { provide: MenubarService, useValue: menubarServiceMock },
      provideMockStore({
        initialState: { filter: { filterGroups: [] } },
        selectors: [
          { selector: selectSpatialFormVisible, value: false },
        ],
      }),
    ],
  });
};

describe('FilterComponent', () => {

  test('should not render if not visible', async () => {
    await setup(false);
    expect(screen.queryByText('Add filter')).not.toBeInTheDocument();
  });

  test('should render if visible', async () => {
    await setup(true);
    expect(screen.getByText('Add filter')).toBeInTheDocument();
  });

});
