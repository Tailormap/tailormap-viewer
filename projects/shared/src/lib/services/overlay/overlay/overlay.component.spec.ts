import { OverlayComponent } from './overlay.component';
import { OverlayContent } from '../overlay-content';
import { OverlayRef } from '../overlay-ref';
import { of } from 'rxjs';
import { SharedImportsModule } from '../../../shared-imports.module';
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
      imports: [ SharedImportsModule ],
      providers: [
        { provide: OverlayRef, useValue: overlayRefMock },
        { provide: OverlayContent, useValue: new OverlayContent('Overlay contents') },
      ],
    });
    expect(screen.getByText('Overlay contents'));
  });

});
