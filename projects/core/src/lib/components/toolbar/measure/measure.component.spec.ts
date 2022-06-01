import { render, screen } from '@testing-library/angular';
import { MeasureComponent } from './measure.component';
import { MapService } from '@tailormap-viewer/map';
import { of, Subject } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { provideMockStore } from '@ngrx/store/testing';
import { selectActiveTool } from '../state/toolbar.selectors';
import { ToolbarComponentEnum } from '../models/toolbar-component.enum';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Store } from '@ngrx/store';
import { activateTool, deactivateTool, registerTool } from '../state/toolbar.actions';

describe('MeasureComponent', () => {

  test('should render', async () => {
    const mapServiceMock = {
      createTooltip$: jest.fn(() => of({})),
      renderFeatures$: jest.fn(() => of(null)),
      createTool$: jest.fn(() => of([])),
    };
    await render(MeasureComponent, {
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: MapService, useValue: mapServiceMock },
        provideMockStore({
          selectors: [
            { selector: selectActiveTool, value: ToolbarComponentEnum.MEASURE },
          ],
        }),
      ],
    });
    expect(screen.getByLabelText('Measure length'));
    expect(screen.getByLabelText('Measure area'));
    expect(mapServiceMock.createTooltip$).toHaveBeenCalled();
    expect(mapServiceMock.renderFeatures$).toHaveBeenCalled();
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
  });

  test('enables tool, acts on drawing, disables tool', async () => {
    const drawingSubject = new Subject<any>();
    const mockDispatch = jest.fn();
    const mockStore = {
      select: () => of('MEASURE'),
      dispatch: mockDispatch,
    };
    const mockTool = {
      id: 'drawingTool',
      drawing$: drawingSubject.asObservable(),
    };
    const tooltipMock: any = {
      freeze: jest.fn(() => tooltipMock),
      hide: jest.fn(() => tooltipMock),
      show: jest.fn(() => tooltipMock),
      setContent: jest.fn(() => tooltipMock),
      move: jest.fn(() => tooltipMock),
    };
    const mapServiceMock = {
      createTooltip$: jest.fn(() => of(tooltipMock)),
      renderFeatures$: jest.fn(() => of(null)),
      createTool$: jest.fn(() => of({ tool: mockTool })),
    };
    await render(MeasureComponent, {
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: MapService, useValue: mapServiceMock },
        { provide: Store, useValue: mockStore },
      ],
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: registerTool.type, tool: { id: ToolbarComponentEnum.MEASURE, mapToolId: 'drawingTool' } });
    mockDispatch.mockClear();

    await userEvent.click(await screen.getByLabelText('Measure length'));
    expect(tooltipMock.hide).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: activateTool.type, tool: ToolbarComponentEnum.MEASURE, enableArguments: { type: 'line' } });
    mockDispatch.mockClear();

    drawingSubject.next({ type: 'start' });
    expect(tooltipMock.hide).toHaveBeenCalled();

    drawingSubject.next({ type: 'change', geometry: '', size: 100, lastCoordinate: [1, 2] });
    expect(tooltipMock.show).toHaveBeenCalled();
    expect(tooltipMock.setContent).toHaveBeenCalledWith('100 m');
    expect(tooltipMock.move).toHaveBeenCalledWith([1, 2]);

    drawingSubject.next({ type: 'change', geometry: '', size: 10000, lastCoordinate: [5, 3] });
    expect(tooltipMock.show).toHaveBeenCalled();
    expect(tooltipMock.setContent).toHaveBeenCalledWith('10 km');
    expect(tooltipMock.move).toHaveBeenCalledWith([5, 3]);

    drawingSubject.next({ type: 'end', geometry: 'GEOM', size: 12000, lastCoordinate: [5, 3] });
    expect(tooltipMock.show).toHaveBeenCalled();
    expect(tooltipMock.setContent).toHaveBeenCalledWith('12 km');
    expect(tooltipMock.move).toHaveBeenCalledWith([5, 3]);
    expect(tooltipMock.freeze).toHaveBeenCalled();

    await userEvent.click(await screen.getByLabelText('Measure length'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: deactivateTool.type, tool: ToolbarComponentEnum.MEASURE });
  });

});
