import { render, screen } from '@testing-library/angular';
import { MeasureComponent } from './measure.component';
import { MapService } from '@tailormap-viewer/map';
import { of, Subject } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';

describe('MeasureComponent', () => {

  test('should render', async () => {
    const mapServiceMock = {
      createTooltip$: jest.fn(() => of({})),
      highlightFeatures$: jest.fn(() => of(null)),
      createTool$: jest.fn(() => of([])),
    };
    await render(MeasureComponent, {
      imports: [
        MatIconModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: MapService, useValue: mapServiceMock },
      ],
    });
    expect(screen.getByLabelText('Measure length'));
    expect(screen.getByLabelText('Measure area'));
    expect(mapServiceMock.createTooltip$).toHaveBeenCalled();
    expect(mapServiceMock.highlightFeatures$).toHaveBeenCalled();
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
  });

  test('enables tool, acts on drawing, disables tool', async () => {
    const drawingSubject = new Subject<any>();
    const mockTool = {
      drawing$: drawingSubject.asObservable(),
    };
    const mockManager = {
      getTool: () => mockTool,
      enableTool: jest.fn(),
      disableTool: jest.fn(),
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
      highlightFeatures$: jest.fn(() => of(null)),
      createTool$: jest.fn(() => of([ mockManager, '' ])),
    };
    await render(MeasureComponent, {
      imports: [
        MatIconModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: MapService, useValue: mapServiceMock },
      ],
    });
    userEvent.click(await screen.getByLabelText('Measure length'));
    expect(tooltipMock.hide).toHaveBeenCalled();
    expect(mockManager.enableTool).toHaveBeenCalled();

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

    userEvent.click(await screen.getByLabelText('Measure length'));
    expect(mockManager.disableTool).toHaveBeenCalled();
  });

});
