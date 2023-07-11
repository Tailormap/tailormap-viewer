import { render, screen } from '@testing-library/angular';
import { EditComponent } from './edit.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

describe('EditButtonComponent', () => {

  test('should render button', async () => {
    const mockDispatch = jest.fn();
    const mockSelect = jest.fn(() => of(null));

    await render(EditComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      componentProviders: [
        {
          provide: Store,
          useValue: { select: mockSelect, dispatch: mockDispatch, pipe: () => of(null) },
        },
      ],
    });
    expect(screen.getByRole('button')).toBeVisible();
  });
});
