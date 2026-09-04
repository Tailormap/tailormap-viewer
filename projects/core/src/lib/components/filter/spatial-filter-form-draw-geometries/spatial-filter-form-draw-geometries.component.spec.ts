import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/angular';
import { SpatialFilterFormDrawGeometriesComponent } from './spatial-filter-form-draw-geometries.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { of } from 'rxjs';
import { createMapServiceMockWithDrawingTools } from '../../../test-helpers/map-service.mock';

// `vi.mock` factories are hoisted above the rest of the file, so a plain outer `let` they close
// over is not reliably connected to the factory (Vitest only special-cases `mock`-prefixed
// bindings, or ones declared through `vi.hoisted`) - use `vi.hoisted` to share the counter safely.
const idState = vi.hoisted(() => ({ count: 0 }));
vi.mock('nanoid', () => ({
  nanoid: () => `id-${++idState.count}`,
}));

const setup = async () => {
  const store = { dispatch: vi.fn(), select: vi.fn(() => of(null)) };
  const mapServiceMock = createMapServiceMockWithDrawingTools();
  const mockSpatialCrudService = { addGeometry: vi.fn(), removeGeometry: vi.fn() };
  await render(SpatialFilterFormDrawGeometriesComponent, {
    imports: [MatIconTestingModule],
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
    const expectedGeom = { geometry: 'CIRCLE(1,2,3)', id: 'id-1' };
    const { addDrawingEvent, addGeometry } = await setup();
    await userEvent.click(screen.getByLabelText('Draw circle'));
    addDrawingEvent({ type: 'end', geometry: expectedGeom.geometry });
    await waitFor(() => {
      expect(addGeometry).toHaveBeenCalledWith(expectedGeom);
    });
  });

});
