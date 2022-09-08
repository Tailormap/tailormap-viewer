import { render, screen } from '@testing-library/angular';
import { ToggleAllLayersButtonComponent } from './toggle-all-layers-button.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectSomeLayersVisible } from '../../../map/state/map.selectors';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ToggleAllLayersButtonComponent', () => {

  test('renders', async () => {
    await render(ToggleAllLayersButtonComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: provideMockStore({ selectors: [{ selector: selectSomeLayersVisible, value: true }] }),
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    expect(screen.findByLabelText('Toggle all layers off'));
    await userEvent.click(await screen.findByRole('button'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: '[Map] Toggle All Layers Visibility' });
    store.overrideSelector(selectSomeLayersVisible, false);
    store.refreshState();
    expect(await screen.findByLabelText('Toggle all layers on'));
  });

});
