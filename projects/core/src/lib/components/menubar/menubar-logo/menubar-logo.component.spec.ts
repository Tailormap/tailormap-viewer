import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { MenubarLogoComponent } from './menubar-logo.component';
import { provideMockStore } from '@ngrx/store/testing';
import { CoreState, coreStateKey, initialCoreState } from '../../../state/core.state';
import { MatIconModule } from '@angular/material/icon';
import { ImageWithDescriptionComponent } from '../../../shared';
import { provideHttpClient } from '@angular/common/http';

describe('MenubarLogoComponent', () => {

  test('should render default logo', async () => {
    await render(MenubarLogoComponent, {
      imports: [ MatIconModule ],
      providers: [provideMockStore({ initialState: { [coreStateKey]: { ...initialCoreState } } })],
      declarations: [ImageWithDescriptionComponent],
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
      imports: [],
      providers: [
        provideMockStore({ initialState: { [coreStateKey]: stateWithLogo } }),
        provideHttpClient(),
      ],
      declarations: [ImageWithDescriptionComponent],
    });
    expect(screen.getByRole('img').closest('tm-image-with-description')).toHaveClass('logo');
    expect(screen.getByRole('img').closest('tm-image-with-description')).toHaveClass('custom-logo');
  });

});
