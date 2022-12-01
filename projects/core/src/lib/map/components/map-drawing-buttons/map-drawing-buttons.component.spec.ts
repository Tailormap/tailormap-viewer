import { render, screen } from '@testing-library/angular';
import { MapDrawingButtonsComponent } from './map-drawing-buttons.component';
import { MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { DrawingFeatureTypeEnum } from '../../models/drawing-feature-type.enum';

const setup = async (allowedDrawingShapes?: DrawingFeatureTypeEnum[]) => {
  const toolManagerMock = {
    enableTool: jest.fn(),
    disableTool: jest.fn(),
  };
  const drawingSubject = new BehaviorSubject({ type: 'start' });
  const selectedFeaturesSubject = new Subject();
  const mapServiceMock = {
    createTool$: jest.fn(({ type }) => {
      const tool = type === ToolTypeEnum.Draw
        ? { id: 'draw-1', drawing$: drawingSubject.asObservable() }
        : { id: 'select-1', selectedFeatures$: selectedFeaturesSubject.asObservable() };
      return of({ tool, manager: toolManagerMock });
    }),
    getToolManager$: jest.fn(() => of(toolManagerMock)),
  };

  const toolChanged = jest.fn();
  const drawingAdded = jest.fn();
  await render(MapDrawingButtonsComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: MapService, useValue: mapServiceMock },
    ],
    componentProperties: {
      allowedShapes: allowedDrawingShapes,
      activeToolChanged: { emit: toolChanged } as any,
      drawingAdded: { emit: drawingAdded } as any,
    },
  });

  return { drawingSubject, toolChanged, drawingAdded };
};

describe('MapDrawingButtonsComponent', () => {

  test('should emit events after enabling tool and drawing', async () => {
    const { drawingSubject, toolChanged, drawingAdded } = await setup();
    expect(screen.getAllByRole('button').length).toEqual(9);
    drawingSubject.next({ type: 'end' });
    expect(drawingAdded).not.toHaveBeenCalled();
    drawingSubject.next({ type: 'start' });
    await userEvent.click(screen.getByLabelText('Draw point'));
    expect(toolChanged).toHaveBeenCalledWith(DrawingFeatureTypeEnum.POINT);
    drawingSubject.next({ type: 'end' });
    expect(drawingAdded).toHaveBeenCalledWith({ type: 'end' });
  });

  test('renders only allowed buttons', async () => {
    await setup([
      DrawingFeatureTypeEnum.CIRCLE,
      DrawingFeatureTypeEnum.POLYGON,
      DrawingFeatureTypeEnum.POINT,
    ]);
    expect(screen.getAllByRole('button').length).toEqual(3);
    expect(screen.getByLabelText('Draw point')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw circle')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw polygon')).toBeInTheDocument();
  });

});
