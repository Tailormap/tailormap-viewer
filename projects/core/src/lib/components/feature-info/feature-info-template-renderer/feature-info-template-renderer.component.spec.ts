import { render } from '@testing-library/angular';
import { FeatureInfoTemplateRendererComponent } from './feature-info-template-renderer.component';

describe('FeatureInfoTemplateRendererComponent', () => {

  test('should render', async () => {
    const { container } = await render(FeatureInfoTemplateRendererComponent, {
      inputs: {
        template: '',
        feature: undefined,
      },
    });
    expect(container.querySelector(".template")).toBeNull();
  });

});
