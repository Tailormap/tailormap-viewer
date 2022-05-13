import { render, screen } from '@testing-library/angular';
import { ScaleBarComponent } from './scale-bar.component';
import { MapService } from '@tailormap-viewer/map';
import { of } from 'rxjs';

describe('ScaleBarComponent', () => {

  test('should render', async () => {
    const mockTool = {
      setTarget: jest.fn((el: HTMLElement) => {
        el.innerHTML = 'TEST COMPLETED';
      }),
    };
    const mapServiceMock = {
      createTool$: jest.fn(() => of({ tool: mockTool })),
    };
    await render(ScaleBarComponent, {
      providers: [
        { provide: MapService, useValue: mapServiceMock },
      ],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
    expect(mockTool.setTarget).toHaveBeenCalled();
    expect(await screen.getByText('TEST COMPLETED'));
  });

});
