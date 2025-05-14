import { render, screen } from '@testing-library/angular';
import { MapDrawingButtonsComponent } from './map-drawing-buttons.component';
import { ToolTypeEnum } from '@tailormap-viewer/map';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { DrawingFeatureTypeEnum } from '../../models/drawing-feature-type.enum';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

export const createMapServiceMock = () => {
  const drawingSubject = new BehaviorSubject<{ type: string; geometry?: string }>({ type: 'start' });
  const selectedFeaturesSubject = new Subject();
  const mapServiceMock = getMapServiceMock(type => {
      switch (type) {
        case ToolTypeEnum.Draw:
          return { id: 'draw-1', drawing$: drawingSubject.asObservable() };
        case ToolTypeEnum.Select:
          return { id: 'select-1', selectedFeatures$: selectedFeaturesSubject.asObservable() };
        case ToolTypeEnum.Modify:
          return { id: 'modify-1', featureModified$: new Subject().asObservable() };
        case ToolTypeEnum.ExtTransform:
          return { id: 'ext-transform-1', featureModified$: new Subject().asObservable(), disableTranslate: jest.fn(), enableTranslate: jest.fn() };
        default:
          return {};
      }
  });
  return {
    mapService: mapServiceMock.mapService,
    provider: mapServiceMock.provider,
    addDrawingEvent: (event: { type: string; geometry?: string }) => drawingSubject.next(event),
    toolManager: mapServiceMock.toolManager,
    createTool$: mapServiceMock.createTool$,
  };
};

const setup = async (allowedDrawingShapes?: DrawingFeatureTypeEnum[]) => {
  const mapServiceMock = createMapServiceMock();
  const toolChanged = jest.fn();
  const drawingAdded = jest.fn();
  await render(MapDrawingButtonsComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      mapServiceMock.provider,
    ],
    inputs: { allowedShapes: allowedDrawingShapes },
    on: {
      activeToolChanged: toolChanged,
      drawingAdded: drawingAdded,
    },
  });

  return { addDrawingEvent: mapServiceMock.addDrawingEvent, toolChanged, drawingAdded };
};

describe('MapDrawingButtonsComponent', () => {

  test('should emit events after enabling tool and drawing', async () => {
    const { addDrawingEvent, toolChanged, drawingAdded } = await setup();
    expect(screen.getAllByRole('button').length).toEqual(9);
    addDrawingEvent({ type: 'end' });
    expect(drawingAdded).not.toHaveBeenCalled();
    addDrawingEvent({ type: 'start' });
    await userEvent.click(screen.getByLabelText('Draw point'));
    expect(toolChanged).toHaveBeenCalledWith(DrawingFeatureTypeEnum.POINT);
    addDrawingEvent({ type: 'end' });
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
