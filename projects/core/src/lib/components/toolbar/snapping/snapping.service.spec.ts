import { describe, test, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { MapService } from '@tailormap-viewer/map';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnappingService } from './snapping.service';
import { DataSourceManagerService } from '../../../services';
import { LoadGeometriesService } from '../../../services/load-geometries.service';
import { DataSourceLayerModel } from '../../../models';
import { selectComponentsConfig, selectCQLFilters, selectViewerId } from '../../../state';

const layer1: DataSourceLayerModel = {
  id: 'layer1',
  layerName: 'layer1',
  title: 'Layer One',
  filterable: true,
  hasAttributes: true,
};

const layer2: DataSourceLayerModel = { ...layer1, id: 'layer2', layerName: 'layer2', title: 'Layer Two' };

const setup = () => {
  const layersWithAttributes$ = new BehaviorSubject<DataSourceLayerModel[]>([ layer1, layer2 ]);
  const mapServiceMock = {
    getMapViewDetails$: () => of({ extent: null }),
    allowSnapping: vi.fn(),
  };
  TestBed.configureTestingModule({
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectComponentsConfig, value: [] },
          { selector: selectCQLFilters, value: new Map() },
          { selector: selectViewerId, value: null },
        ],
      }),
      { provide: MapService, useValue: mapServiceMock },
      { provide: MatSnackBar, useValue: {} },
      { provide: LoadGeometriesService, useValue: { loadGeometries$: vi.fn() } },
      { provide: DataSourceManagerService, useValue: { layersWithAttributes$, getDescribeLayer$: vi.fn() } },
    ],
  });
  const service = TestBed.inject(SnappingService);
  return { service, mapServiceMock, layersWithAttributes$ };
};

describe('SnappingService', () => {

  test('does not enable snapping without snapping layers', () => {
    const { service, mapServiceMock } = setup();
    service.enableSnapping();
    expect(service.isSnappingActive()).toBe(false);
    expect(mapServiceMock.allowSnapping).not.toHaveBeenCalled();
  });

  test('enables snapping when a layer is selected and disables it when the last layer is deselected', () => {
    const { service, mapServiceMock } = setup();
    service.toggleLayer(layer1);
    expect(service.isSnappingActive()).toBe(true);
    expect(mapServiceMock.allowSnapping).toHaveBeenLastCalledWith(true);
    service.toggleLayer(layer1);
    expect(service.isSnappingActive()).toBe(false);
    expect(mapServiceMock.allowSnapping).toHaveBeenLastCalledWith(false);
  });

  test('disables snapping when the snapping layer is no longer selectable', () => {
    const { service, mapServiceMock, layersWithAttributes$ } = setup();
    service.toggleLayer(layer1);
    service.toggleLayer(layer2);
    layersWithAttributes$.next([layer2]);
    expect(service.isSnappingActive()).toBe(true);
    layersWithAttributes$.next([]);
    expect(service.isSnappingActive()).toBe(false);
    expect(service.hasSnappingLayers()).toBe(false);
    expect(mapServiceMock.allowSnapping).toHaveBeenLastCalledWith(false);
  });

});
