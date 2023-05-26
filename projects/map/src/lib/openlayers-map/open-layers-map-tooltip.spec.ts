import { OpenLayersMapTooltip } from './open-layers-map-tooltip';
import { screen } from '@testing-library/angular';

const getMapMock = () => ({
  addOverlay: jest.fn(overlay => {
    document.body.appendChild(overlay.getElement());
  }),
  removeOverlay: jest.fn(overlay => {
    try {
      document.body.removeChild(overlay.getElement());
    } catch (e) {
      // ignore error
    }
  }),
});

describe('OpenLayersMapTooltip', () => {

  test('creates a tooltip', async () => {
    const mapMock = getMapMock();
    const tooltip = new OpenLayersMapTooltip(mapMock as any);
    expect(mapMock.addOverlay).toHaveBeenCalled();
    expect(document.querySelector('.ol-tooltip')).not.toBeNull();
    tooltip.setContent('TEST CONTENT');
    expect(await screen.findByText('TEST CONTENT')).toBeInTheDocument();
    tooltip.move([ 5, 5 ]);
    expect(document.querySelector('.ol-tooltip--moving')).not.toBeNull();
    tooltip.freeze();
    expect(document.querySelector('.ol-tooltip--moving')).toBeNull();
    expect(document.querySelector('.ol-tooltip--static')).not.toBeNull();
  });

  test('destroys a tooltip', async () => {
    const mapMock = getMapMock();
    const tooltip = new OpenLayersMapTooltip(mapMock as any);
    const content = document.createElement('div');
    content.className = 'test-content-class';
    content.innerHTML = 'HTML CONTENT';
    tooltip.setContent(content);
    expect(await screen.findByText('HTML CONTENT')).toBeInTheDocument();
    expect(document.querySelector('.test-content-class')).not.toBeNull();
    tooltip.destroy();
    expect(await screen.queryByText('HTML CONTENT')).not.toBeInTheDocument();
    expect(mapMock.removeOverlay).toHaveBeenCalled();

  });

});
