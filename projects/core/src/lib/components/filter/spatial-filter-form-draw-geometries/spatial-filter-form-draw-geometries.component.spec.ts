import { render, screen, waitFor } from '@testing-library/angular';
import { SpatialFilterFormDrawGeometriesComponent } from './spatial-filter-form-draw-geometries.component';
import { createMapServiceMock } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component.spec';
import { MapDrawingButtonsComponent } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { addGeometry } from '../state/filter-component.actions';

let idCount = 0;
jest.mock('nanoid', () => ({
  nanoid: () => {
    idCount++;
    return `id-${idCount}`;
  },
}));

const setup = async () => {
  const store = { dispatch: jest.fn() };
  const mapServiceMock = createMapServiceMock();
  await render(SpatialFilterFormDrawGeometriesComponent, {
    declarations: [MapDrawingButtonsComponent],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: Store, useValue: store },
      mapServiceMock.provider,
    ],
  });
  return {
    addDrawingEvent: mapServiceMock.addDrawingEvent,
    dispatch: store.dispatch,
  };
};

describe('SpatialFilterFormDrawGeometriesComponent', () => {

  test('should render and handle add drawing event', async () => {
    const expectedGeom = { geometry: 'CIRCLE(1,2,3)', id: 'id-1' };
    const { addDrawingEvent, dispatch } = await setup();
    await userEvent.click(screen.getByLabelText('Draw circle'));
    addDrawingEvent({ type: 'end', geometry: expectedGeom.geometry });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(addGeometry({ geometry: expectedGeom }));
    });
  });

});
