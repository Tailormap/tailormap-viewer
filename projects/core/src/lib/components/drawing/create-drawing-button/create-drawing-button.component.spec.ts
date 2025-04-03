import { render, screen } from '@testing-library/angular';
import { CreateDrawingButtonComponent } from './create-drawing-button.component';
import { Store } from '@ngrx/store';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { MapDrawingButtonsComponent } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component';
import { createMapServiceMock } from '../../../map/components/map-drawing-buttons/map-drawing-buttons.component.spec';
import { of } from 'rxjs';

describe('CreateDrawingButtonComponent', () => {

  test('renders and toggles buttons / tools', async () => {
    const mockDispatch = jest.fn();
    const mapServiceMock = createMapServiceMock();
    await render(CreateDrawingButtonComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      declarations: [MapDrawingButtonsComponent],
      providers: [
        { provide: Store, useValue: { dispatch: mockDispatch, select: () => of(null) } },
        mapServiceMock.provider,
      ],
    });

    expect(mapServiceMock.createTool$).toHaveBeenCalledTimes(3);
    expect(mapServiceMock.toolManager.enableTool).toHaveBeenCalledWith('select-1', true);

    mapServiceMock.toolManager.enableTool.mockClear();
    mapServiceMock.toolManager.disableTool.mockClear();

    const buttons = await screen.getAllByRole('button');
    expect(buttons.length).toEqual(9);
    await userEvent.click(await screen.getByLabelText('Draw point'));
    expect(mapServiceMock.toolManager.enableTool).toHaveBeenCalledWith('draw-1', true, { type: 'point' });
    expect(mapServiceMock.toolManager.disableTool).toHaveBeenCalledWith('select-1', true);

    mapServiceMock.toolManager.enableTool.mockClear();
    mapServiceMock.toolManager.disableTool.mockClear();

    await userEvent.click(await screen.getByLabelText('Draw circle'));
    expect(mapServiceMock.toolManager.enableTool).toHaveBeenCalledWith('draw-1', true, { type: 'circle' });
    expect(mapServiceMock.toolManager.disableTool).toHaveBeenCalledWith('select-1', true);

    mapServiceMock.toolManager.enableTool.mockClear();
    mapServiceMock.toolManager.disableTool.mockClear();

    await userEvent.click(await screen.getByLabelText('Draw circle'));
    expect(mapServiceMock.toolManager.enableTool).toHaveBeenCalledWith('select-1', true);
    expect(mapServiceMock.toolManager.disableTool).toHaveBeenCalledWith('draw-1', true);
  });

});
