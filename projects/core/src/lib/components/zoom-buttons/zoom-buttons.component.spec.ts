import { render, screen } from '@testing-library/angular';
import { ZoomButtonsComponent } from './zoom-buttons.component';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

describe('ZoomButtonsComponent', () => {

  test('renders and handles clicks', async () => {
    const zoomInFn = jest.fn();
    const zoomOutFn = jest.fn();
    const mapService = {
      provide: MapService,
      useValue: {
        getResolution$: () => of({ zoomLevel: 1, minZoomLevel: 0, maxZoomLevel: 2 }),
        zoomIn: zoomInFn,
        zoomOut: zoomOutFn,
      },
    };
    await render(ZoomButtonsComponent, { providers: [mapService], imports: [ MatIconTestingModule, SharedImportsModule ] });
    const zoomInBtn = await screen.getByLabelText('Zoom in');
    const zoomOutBtn = await screen.getByLabelText('Zoom out');
    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    userEvent.click(zoomInBtn);
    expect(zoomInFn).toHaveBeenCalled();
    userEvent.click(zoomOutBtn);
    expect(zoomOutFn).toHaveBeenCalled();
  });

  test('disables zoom in button on max zoom level reached', async () => {
    const mapService = {
      provide: MapService,
      useValue: {
        getResolution$: () => of({ zoomLevel: 2, minZoomLevel: 0, maxZoomLevel: 2 }),
        zoomIn: jest.fn(),
        zoomOut: jest.fn(),
      },
    };
    await render(ZoomButtonsComponent, { providers: [mapService], imports: [ MatIconTestingModule, SharedImportsModule ] });
    const zoomInBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom in');
    const zoomOutBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom out');
    expect(zoomInBtn.disabled).toEqual(true);
    expect(zoomOutBtn.disabled).toEqual(false);
  });

  test('disables zoom out button on max zoom level reached', async () => {
    const mapService = {
      provide: MapService,
      useValue: {
        getResolution$: () => of({ zoomLevel: 0, minZoomLevel: 0, maxZoomLevel: 2 }),
        zoomIn: jest.fn(),
        zoomOut: jest.fn(),
      },
    };
    await render(ZoomButtonsComponent, { providers: [mapService], imports: [ MatIconTestingModule, SharedImportsModule ] });
    const zoomInBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom in');
    const zoomOutBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom out');
    expect(zoomInBtn.disabled).toEqual(false);
    expect(zoomOutBtn.disabled).toEqual(true);
  });

});
