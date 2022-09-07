import { render, screen } from '@testing-library/angular';
import { ToggleAllLayersButtonComponent } from './toggle-all-layers-button.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectAllLayersVisible } from '../../../map/state/map.selectors';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';

describe('ToggleAllLayersButtonComponent', () => {

  test('renders', async () => {
    await render(ToggleAllLayersButtonComponent, {
      providers: provideMockStore({ selectors: [{ selector: selectAllLayersVisible, value: true }] }),
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    expect(screen.findByText('Toggle all layers off'));
    await userEvent.click(await screen.findByRole('button'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: '[Map] Toggle All Layers Visibility' });
    store.overrideSelector(selectAllLayersVisible, false);
    store.refreshState();
    expect(await screen.findByText('Toggle all layers on'));
  });

});
