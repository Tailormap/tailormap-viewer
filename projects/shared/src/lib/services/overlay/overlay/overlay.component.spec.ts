import { describe, test, expect } from 'vitest';
import { OverlayComponent } from './overlay.component';
import { OverlayContent } from '../overlay-content';
import { OverlayRef } from '../overlay-ref';
import { of } from 'rxjs';
import { render, screen } from '@testing-library/angular';

describe('OverlayComponent', () => {

  test('should render', async () => {
    const overlayRefMock = {
      close: () => {},
      afterClosed$: of({
        type: 'close',
        data: null,
      }),
    };
    await render(OverlayComponent, {
      providers: [
        { provide: OverlayRef, useValue: overlayRefMock },
        { provide: OverlayContent, useValue: new OverlayContent('Overlay contents') },
      ],
    });
    expect(screen.getByText('Overlay contents'));
  });

});
