import { render, screen } from '@testing-library/angular';
import { ScaleBarComponent } from './scale-bar.component';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock.spec';

describe('ScaleBarComponent', () => {

  test('should render', async () => {
    const mockTool = {
      setTarget: jest.fn((el: HTMLElement) => {
        el.innerHTML = 'TEST COMPLETED';
      }),
    };
    const mapServiceMock = getMapServiceMock(() => mockTool);
    await render(ScaleBarComponent, {
      providers: [mapServiceMock.provider],
    });
    expect(mapServiceMock.createTool$).toHaveBeenCalled();
    expect(mockTool.setTarget).toHaveBeenCalled();
    expect(await screen.getByText('TEST COMPLETED'));
  });

});
