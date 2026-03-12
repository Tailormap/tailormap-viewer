import { render, screen } from '@testing-library/angular';
import { ToggleAllLayersButtonComponent } from './toggle-all-layers-button.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { selectFilterEnabled, selectFilterTerm, selectSomeLayersVisibleInToc } from '../state/toc.selectors';

describe('ToggleAllLayersButtonComponent', () => {

  test('renders', async () => {
    await render(ToggleAllLayersButtonComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: provideMockStore({ selectors: [
          { selector: selectSomeLayersVisibleInToc, value: true },
          { selector: selectFilterEnabled, value: false },
          { selector: selectFilterTerm, value: undefined },
      ] }),
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    expect(screen.findByLabelText('Toggle all layers off'));
    await userEvent.click(await screen.findByRole('button'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: '[Map] Toggle All Layers Visibility' });
    store.overrideSelector(selectSomeLayersVisibleInToc, false);
    store.refreshState();
    expect(await screen.findByLabelText('Toggle all layers on'));
  });

  test('renders with filter', async () => {
    await render(ToggleAllLayersButtonComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      providers: provideMockStore({ selectors: [
          { selector: selectSomeLayersVisibleInToc, value: false },
          { selector: selectFilterEnabled, value: true },
          { selector: selectFilterTerm, value: 'test' },
        ] }),
    });
    const store = TestBed.inject(MockStore);
    store.dispatch = jest.fn();
    expect(screen.findByLabelText('Toggle all layers on'));
    await userEvent.click(await screen.findByRole('button'));
    expect(store.dispatch).toHaveBeenCalledWith({ type: '[Map] Toggle All Layers Visibility', filterTerm: 'test' });
  });

});
