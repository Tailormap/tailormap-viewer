import { render, screen } from '@testing-library/angular';
import { MapDrawingButtonsComponent } from './map-drawing-buttons.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { DrawingFeatureTypeEnum } from '../../../../map/models/drawing-feature-type.enum';
import { createMapServiceMockWithDrawingTools } from '../../../../test-helpers/map-service.mock.spec';

const setup = async (allowedDrawingShapes?: DrawingFeatureTypeEnum[]) => {
  const mapServiceMock = createMapServiceMockWithDrawingTools();
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
