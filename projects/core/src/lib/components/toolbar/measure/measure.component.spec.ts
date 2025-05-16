import { render, screen } from '@testing-library/angular';
import { MeasureComponent } from './measure.component';
import { Subject } from 'rxjs';
import { createMockStore } from '@ngrx/store/testing';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import { selectComponentsConfig } from '../../../state/core.selectors';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

const setup = async () => {
  const drawingSubject = new Subject<any>();
  const mockTool = {
    id: 'drawingTool',
    drawing$: drawingSubject.asObservable(),
  };
  const mapServiceMock = getMapServiceMock(() => mockTool);
  const mockStore = createMockStore({
    selectors: [
      { selector: selectActiveTool, value: ToolbarComponentEnum.MEASURE },
      { selector: selectComponentsConfig, value: [] },
    ],
  });
  const mockDispatch = jest.fn();
  mockStore.dispatch = mockDispatch;
  await render(MeasureComponent, {
    imports: [
      SharedModule,
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
