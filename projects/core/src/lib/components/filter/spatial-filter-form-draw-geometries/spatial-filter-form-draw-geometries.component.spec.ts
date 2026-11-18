import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { SpatialFilterFormDrawGeometriesComponent } from './spatial-filter-form-draw-geometries.component';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { of } from 'rxjs';
import { createMapServiceMockWithDrawingTools } from '../../../test-helpers/map-service.mock';

const setup = async () => {
  const store = { dispatch: vi.fn(), select: vi.fn(() => of(null)) };
  const mapServiceMock = createMapServiceMockWithDrawingTools();
  const mockSpatialCrudService = { addGeometry: vi.fn(), removeGeometry: vi.fn() };
  await render(SpatialFilterFormDrawGeometriesComponent, {
    imports: [],
    providers: [
      { provide: Store, useValue: store },
      mapServiceMock.provider,
      { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService },
    ],
  });
  return {
    addDrawingEvent: mapServiceMock.addDrawingEvent,
    addGeometry: mockSpatialCrudService.addGeometry,
    removeGeometry: mockSpatialCrudService.removeGeometry,
  };
};

describe('SpatialFilterFormDrawGeometriesComponent', () => {

  test('should render and handle add drawing event', async () => {
    const expectedGeom = { geometry: 'CIRCLE(1,2,3)', id: expect.any(String) };
    const { addDrawingEvent, addGeometry } = await setup();
    await userEvent.click(screen.getByLabelText('Draw circle'));
    addDrawingEvent({ type: 'end', geometry: expectedGeom.geometry });
    await vi.waitFor(() => {
      expect(addGeometry).toHaveBeenCalledWith(expectedGeom);
    });
  });

});
