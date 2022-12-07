import { render, screen, waitFor } from '@testing-library/angular';
import { SpatialFilterFormBufferComponent } from './spatial-filter-form-buffer.component';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';

const setup = async (initialValue: number | undefined) => {
  const store = { select: jest.fn(() => of(initialValue)), dispatch: jest.fn() };
  const mockSpatialCrudService = { updateBuffer: jest.fn() };
  await render(SpatialFilterFormBufferComponent, {
    imports: [SharedImportsModule],
    providers: [
      { provide: Store, useValue: store },
      { provide: SpatialFilterCrudService, useValue: mockSpatialCrudService },
    ],
  });
  return { updateBuffer: mockSpatialCrudService.updateBuffer };
};

describe('SpatialFilterFormBufferComponent', () => {

  test('should render and update value', async () => {
    const { updateBuffer } = await setup(undefined);
    expect(await screen.findByLabelText('Buffer in meters')).toBeInTheDocument();
    expect(await screen.findByRole('spinbutton')).toHaveValue(0);
    await userEvent.type(await screen.findByRole('spinbutton'), '10');
    await waitFor(() => {
      expect(updateBuffer).toHaveBeenCalledWith(10);
    });
  });

  test('should patch existing value', async () => {
    await setup(50);
    expect(await screen.findByRole('spinbutton')).toHaveValue(50);
  });

});
