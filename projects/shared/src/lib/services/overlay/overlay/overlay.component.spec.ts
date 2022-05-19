import { OverlayComponent } from './overlay.component';
import { createComponentFactory, createSpyObject, Spectator } from '@ngneat/spectator';
import { OverlayContent } from '../overlay-content';
import { OverlayRef } from '../overlay-ref';
import { of } from 'rxjs';
import { SharedImportsModule } from '../../../shared-imports.module';

describe('OverlayComponent', () => {
  let spectator: Spectator<OverlayComponent>;
  const overlayRefMock = createSpyObject(OverlayRef, {
    close() {},
    afterClosed$: of(null),
  });
  const createComponent = createComponentFactory({
    component: OverlayComponent,
    imports: [ SharedImportsModule ],
    providers: [
      { provide: OverlayRef, useValue: overlayRefMock },
      { provide: OverlayContent, useValue: new OverlayContent('') },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });
});
