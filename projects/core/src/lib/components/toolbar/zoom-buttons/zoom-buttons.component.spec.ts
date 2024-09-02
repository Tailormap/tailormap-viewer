import { render, screen } from '@testing-library/angular';
import { ZoomButtonsComponent } from './zoom-buttons.component';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async (zoomDetails: { zoomLevel: number; minZoomLevel: number; maxZoomLevel: number }) => {
  const mapService = getMapServiceMock(null, '',  {
    getMapViewDetails$: () => of(zoomDetails),
  });
  await render(ZoomButtonsComponent, { providers: [mapService.provider], imports: [ MatIconTestingModule, SharedModule ] });
  return {
    zoomIn: mapService.mapService.zoomIn,
    zoomOut: mapService.mapService.zoomOut,
    zoomToInitialExtent: mapService.mapService.zoomToInitialExtent,
  };
};

describe('ZoomButtonsComponent', () => {

  test('renders and handles clicks', async () => {
    const { zoomIn, zoomOut, zoomToInitialExtent } = await setup({ zoomLevel: 1, minZoomLevel: 0, maxZoomLevel: 2 });
    const zoomInBtn = await screen.getByLabelText('Zoom in');
    const zoomOutBtn = await screen.getByLabelText('Zoom out');
    const zoomToInitialExtentBtn = await screen.getByLabelText('Zoom to initial extent');
    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    await userEvent.click(zoomInBtn);
    expect(zoomIn).toHaveBeenCalled();
    await userEvent.click(zoomOutBtn);
    expect(zoomOut).toHaveBeenCalled();
    await userEvent.click(zoomToInitialExtentBtn);
    expect(zoomToInitialExtent).toHaveBeenCalled();
  });

  test('disables zoom in button on max zoom level reached', async () => {
    await setup({ zoomLevel: 2, minZoomLevel: 0, maxZoomLevel: 2 });
    const zoomInBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom in');
    const zoomOutBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom out');
    expect(zoomInBtn.disabled).toEqual(true);
    expect(zoomOutBtn.disabled).toEqual(false);
  });

  test('disables zoom out button on max zoom level reached', async () => {
    await setup({ zoomLevel: 0, minZoomLevel: 0, maxZoomLevel: 2 });
    const zoomInBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom in');
    const zoomOutBtn = await screen.getByLabelText<HTMLButtonElement>('Zoom out');
    expect(zoomInBtn.disabled).toEqual(false);
    expect(zoomOutBtn.disabled).toEqual(true);
  });

});
