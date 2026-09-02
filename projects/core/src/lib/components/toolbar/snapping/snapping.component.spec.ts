import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { SnappingComponent } from './snapping.component';
import { BehaviorSubject, of } from 'rxjs';
import { createMockStore } from '@ngrx/store/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import { MapService } from '@tailormap-viewer/map';
import { SnappingService } from './snapping.service';
import { selectComponentsConfig } from '../../../state';

const mockLayer = {
  id: 'layer1',
  layerName: 'layer1',
  title: 'Layer One',
  serviceId: 'service-1',
  visible: true,
  hasAttributes: true,
  editable: true,
  opacity: 1,
  searchIndex: null,
};

const setup = async (snappingActive = false) => {
  const mapServiceMock = {
    setSnappingTolerance: vi.fn(),
    setSnappingLayerStyle: vi.fn(),
    setSnappingFeatures: vi.fn(),
    allowSnapping: vi.fn(),
  };

  const snappingServiceMock = {
    snappingLayers$: new BehaviorSubject([]),
    snappingGeometries$: new BehaviorSubject([]),
    snappingActive$: of(snappingActive),
    isSnappingActive: vi.fn(() => snappingActive),
    hasSelectableLayers$: of(true),
    selectableLayers$: of([mockLayer]),
    toggleLayer: vi.fn(),
    enableSnapping: vi.fn(),
    disableSnapping: vi.fn(),
  };

  const mockStore = createMockStore({
    selectors: [
      { selector: selectComponentsConfig, value: [{ type: 'SNAPPING', config: { tolerance: 10, selectedLayers: ['layer1'] } }] },
    ],
  });

  await render(SnappingComponent, {
    imports: [MatIconTestingModule],
    providers: [
      { provide: MapService, useValue: mapServiceMock },
      { provide: SnappingService, useValue: snappingServiceMock },
      { provide: Store, useValue: mockStore },
    ],
  });

  return { mapServiceMock, snappingServiceMock };
};

describe('SnappingComponent', () => {

  test('should initialise snapping settings on init', async () => {
    const { mapServiceMock } = await setup(true);
    expect(mapServiceMock.setSnappingTolerance).toHaveBeenCalledWith(10);
    expect(mapServiceMock.setSnappingLayerStyle).toHaveBeenCalledWith(
      expect.objectContaining({ styleKey: 'snapping-style', zIndex: 999, strokeWidth: 3 }),
    );
  });

  test('should enable snapping when toggle button is clicked', async () => {
    const { mapServiceMock, snappingServiceMock } = await setup();
    await userEvent.click(screen.getAllByRole('presentation')[0]);
    expect(mapServiceMock.allowSnapping).toHaveBeenCalledWith(true);
    expect(snappingServiceMock.enableSnapping).toHaveBeenCalled();
  });

  test('should disable snapping when toggle button is clicked a second time', async () => {
    const { mapServiceMock, snappingServiceMock } = await setup(true);
    const toggleBtn = screen.getAllByRole('presentation')[0];
    await userEvent.click(toggleBtn);
    await userEvent.click(toggleBtn);
    expect(mapServiceMock.allowSnapping).toHaveBeenLastCalledWith(false);
    expect(snappingServiceMock.disableSnapping).toHaveBeenCalled();
  });

  test('should show list of layers when dropdown button is clicked', async () => {
    await setup(true);
    const dropdownBtn = screen.getAllByRole('presentation')[1];
    await userEvent.click(dropdownBtn);
    expect(screen.getByText('Layer One')).toBeInTheDocument();
  });

});
