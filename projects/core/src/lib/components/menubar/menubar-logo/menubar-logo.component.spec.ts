import { render, screen } from '@testing-library/angular';
import { MenubarLogoComponent } from './menubar-logo.component';
import { provideMockStore } from '@ngrx/store/testing';
import { CoreState, coreStateKey, initialCoreState } from '../../../state/core.state';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';

describe('MenubarLogoComponent', () => {

  test('should render default logo', async () => {
    await render(MenubarLogoComponent, {
      imports: [ MatIconModule, MatIconTestingModule ],
      providers: [provideMockStore({ initialState: { [coreStateKey]: { ...initialCoreState } } })],
    });
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('logo');
    expect(screen.getByRole('img', { hidden: true })).not.toHaveClass('custom-logo');
  });

  test('should render custom logo', async () => {
    const stateWithLogo: CoreState = {
      ...initialCoreState,
      viewer: {
        components: [],
        styling: {
          logo: 'https://tailormap.nl/logo.png',
        },
      },
    };
    await render(MenubarLogoComponent, {
      imports: [MatIconTestingModule],
      providers: [provideMockStore({ initialState: { [coreStateKey]: stateWithLogo } })],
    });
    expect(screen.getByRole('img')).toHaveClass('logo');
    expect(screen.getByRole('img')).toHaveClass('custom-logo');
  });

});
