import { render, screen } from '@testing-library/angular';
import { MeasureComponent } from './measure.component';
import { of, Subject } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { createMockStore } from '@ngrx/store/testing';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import { activateTool, deactivateTool, registerTool } from '../state/toolbar.actions';
import { selectComponentsConfig } from '../../../state/core.selectors';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';
import { selectIn3DView } from '../../../map/state/map.selectors';

const setup = async () => {
  const tooltipMock: any = {
    freeze: jest.fn(() => tooltipMock),
    hide: jest.fn(() => tooltipMock),
    show: jest.fn(() => tooltipMock),
    setContent: jest.fn(() => tooltipMock),
    move: jest.fn(() => tooltipMock),
  };
  const drawingSubject = new Subject<any>();
  const mockTool = {
    id: 'drawingTool',
    drawing$: drawingSubject.asObservable(),
  };
  const mapServiceMock = getMapServiceMock(() => mockTool, '', {
    createTooltip$: jest.fn(() => of(tooltipMock)),
  });
  const mockStore = createMockStore({
    selectors: [
      { selector: selectActiveTool, value: ToolbarComponentEnum.MEASURE },
      { selector: selectComponentsConfig, value: [] },
      { selector: selectIn3DView, value: false },
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
  return { mapServiceMock, mockStore, mockDispatch, tooltipMock, drawingSubject, mockTool };
};

describe('MeasureComponent', () => {

  test('should render', async () => {
    const { mapServiceMock } = await setup();
    expect(screen.getByLabelText('Measure distance'));
    expect(screen.getByLabelText('Measure area'));
    expect(mapServiceMock.mapService.createTooltip$).toHaveBeenCalled();
    expect(mapServiceMock.mapService.renderFeatures$).toHaveBeenCalled();
    expect(mapServiceMock.mapService.createTool$).toHaveBeenCalled();
  });

  test('enables tool, acts on drawing, disables tool', async () => {
    const { mockDispatch, tooltipMock, drawingSubject } = await setup();
    expect(mockDispatch).toHaveBeenCalledWith({ type: registerTool.type, tool: { id: ToolbarComponentEnum.MEASURE, mapToolId: 'drawingTool' } });
    mockDispatch.mockClear();

    await userEvent.click(screen.getByLabelText('Measure distance'));
    expect(tooltipMock.hide).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: activateTool.type, tool: ToolbarComponentEnum.MEASURE, enableArguments: { type: 'line' } });
    mockDispatch.mockClear();

    drawingSubject.next({ type: 'start' });
    expect(tooltipMock.hide).toHaveBeenCalled();

    drawingSubject.next({ type: 'change', geometry: '', size: 100, lastCoordinate: [ 1, 2 ] });
    expect(tooltipMock.show).toHaveBeenCalled();
    expect(tooltipMock.setContent).toHaveBeenCalledWith('100 m');
    expect(tooltipMock.move).toHaveBeenCalledWith([ 1, 2 ]);

    drawingSubject.next({ type: 'change', geometry: '', size: 10000, lastCoordinate: [ 5, 3 ] });
    expect(tooltipMock.show).toHaveBeenCalled();
    expect(tooltipMock.setContent).toHaveBeenCalledWith('10 km');
    expect(tooltipMock.move).toHaveBeenCalledWith([ 5, 3 ]);

    drawingSubject.next({ type: 'end', geometry: 'GEOM', size: 12000, lastCoordinate: [ 5, 3 ] });
    expect(tooltipMock.show).toHaveBeenCalled();
    expect(tooltipMock.setContent).toHaveBeenCalledWith('12 km');
    expect(tooltipMock.move).toHaveBeenCalledWith([ 5, 3 ]);
    expect(tooltipMock.freeze).toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Measure distance'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: deactivateTool.type, tool: ToolbarComponentEnum.MEASURE });
  });

});
