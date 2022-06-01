import { render, screen } from '@testing-library/angular';
import { CreateDrawingButtonComponent } from './create-drawing-button.component';
import { of, Subject } from 'rxjs';
import { MapService, ToolTypeEnum } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

describe('CreateDrawingButtonComponent', () => {

  test('renders and toggles buttons / tools', async () => {
    const mockDispatch = jest.fn();
    const toolManagerMock = {
      enableTool: jest.fn(),
      disableTool: jest.fn(),
    };
    const drawingSubject = new Subject();
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
    await render(CreateDrawingButtonComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      providers: [
        { provide: Store, useValue: { dispatch: mockDispatch }},
        { provide: MapService, useValue: mapServiceMock },
      ],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalledTimes(2);
    expect(toolManagerMock.enableTool).toHaveBeenCalledWith('select-1', true);

    toolManagerMock.enableTool.mockClear();
    toolManagerMock.disableTool.mockClear();

    const buttons = await screen.getAllByRole('button');
    expect(buttons.length).toEqual(5);
    await userEvent.click(await screen.getByLabelText('Draw point'));
    expect(toolManagerMock.enableTool).toHaveBeenCalledWith('draw-1', true, { type: 'point' });
    expect(toolManagerMock.disableTool).toHaveBeenCalledWith('select-1', true);

    toolManagerMock.enableTool.mockClear();
    toolManagerMock.disableTool.mockClear();

    await userEvent.click(await screen.getByLabelText('Draw circle'));
    expect(toolManagerMock.enableTool).toHaveBeenCalledWith('draw-1', true, { type: 'circle' });
    expect(toolManagerMock.disableTool).toHaveBeenCalledWith('select-1', true);

    toolManagerMock.enableTool.mockClear();
    toolManagerMock.disableTool.mockClear();

    await userEvent.click(await screen.getByLabelText('Draw circle'));
    expect(toolManagerMock.enableTool).toHaveBeenCalledWith('select-1', true);
    expect(toolManagerMock.disableTool).toHaveBeenCalledWith('draw-1', true);
  });

});
