import { AttributeListMenuButtonComponent } from './attribute-list-menu-button.component';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { MenubarButtonComponent, MenubarService } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { getLoadedStoreNoRows } from '../state/mocks/attribute-list-state-test-data';
import { TestBed } from '@angular/core/testing';
import { setAttributeListVisibility } from '../state/attribute-list.actions';

describe('AttributeListMenuButtonComponent', () => {

  test('renders', async () => {
    const menubarService = {
      isComponentVisible$: () => of(false),
    };
    await render(AttributeListMenuButtonComponent, {
      declarations: [MenubarButtonComponent],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MenubarService, useValue: menubarService },
        provideMockStore({ initialState: getLoadedStoreNoRows() }),
      ],
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();

    expect(await screen.findByRole('button')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button'));
    expect(store.dispatch).toHaveBeenCalledWith({
      type: setAttributeListVisibility.type,
    });
  });

});
