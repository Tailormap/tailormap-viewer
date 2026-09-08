import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { MeasureComponent } from './measure.component';
import { Subject } from 'rxjs';
import { createMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import { selectComponentsConfig } from '../../../state/core.selectors';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';

const setup = async () => {
  const drawingSubject = new Subject<any>();
  const mockTool = {
    id: 'drawingTool',
    drawing$: drawingSubject.asObservable(),
  };
  const mapServiceMock = getMapServiceMock(() => mockTool);
  const mockStore = createMockStore({
    selectors: [
      { selector: selectComponentsConfig, value: [] },
    ],
  });
  const mockDispatch = vi.fn();
  mockStore.dispatch = mockDispatch;
  await render(MeasureComponent, {
    imports: [
      NoopAnimationsModule,
      MatIconTestingModule,
    ],
    providers: [
      mapServiceMock.provider,
      { provide: Store, useValue: mockStore },
    ],
  });
  return { mapServiceMock, mockStore, mockDispatch, drawingSubject, mockTool };
};

describe('MeasureComponent', () => {

  test('should render', async () => {
    const { mapServiceMock } = await setup();
    expect(screen.getByLabelText('Measure distance'));
    expect(screen.getByLabelText('Measure area'));
    expect(mapServiceMock.mapService.renderFeatures$).toHaveBeenCalled();
    expect(mapServiceMock.mapService.createTool$).toHaveBeenCalled();
  });

});
