import { render } from '@testing-library/angular';
import { FeatureInfoSpinnerComponent } from './feature-info-spinner.component';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { featureInfoStateKey } from '../state/feature-info.state';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('FeatureInfoSpinnerComponent', () => {

  test('should render', async () => {
    const mapService = { getPixelForCoordinates$: jest.fn((coords: [number, number]) => of(coords)) };
    const { container } = await render(FeatureInfoSpinnerComponent, {
      providers: [
        provideMockStore({initialState: { [featureInfoStateKey]: { loadingData: false, mapCoordinates: undefined } }}),
        { provide: MapService, useValue: mapService },
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    });
    const spinner = container.querySelector<HTMLDivElement>('.spinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.style.display).toEqual('none');
    expect(mapService.getPixelForCoordinates$).not.toHaveBeenCalled();
  });

  test('should render on coordinates', async () => {
    const mapService = { getPixelForCoordinates$: jest.fn((coords: [number, number]) => of(coords)) };
    const { container } = await render(FeatureInfoSpinnerComponent, {
      providers: [
        provideMockStore({initialState: { [featureInfoStateKey]: { loadingData: true, mapCoordinates: [5, 5]} }}),
        { provide: MapService, useValue: mapService },
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    });
    const spinner = container.querySelector<HTMLDivElement>('.spinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.style.left).toEqual('5px');
    expect(spinner?.style.top).toEqual('5px');
    expect(mapService.getPixelForCoordinates$).toHaveBeenCalledWith([5, 5]);
  });

});
