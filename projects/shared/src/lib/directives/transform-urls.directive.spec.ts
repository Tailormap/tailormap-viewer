import { TransformUrlsDirective } from './transform-urls.directive';
import { render, screen } from '@testing-library/angular';

describe('TransformUrlsDirective', () => {

  it('renders back normal text', async () => {
    await render('<div tmTransformUrls>Some text</div>', {
      declarations: [TransformUrlsDirective],
    });
    expect(await screen.findByText('Some text')).toBeInTheDocument();
  });

  it('transforms urls into hyperlinks', async () => {
    await render('<div tmTransformUrls>Some text with some https://www.test.nl in it</div>', {
      declarations: [TransformUrlsDirective],
    });
    expect(await screen.getByRole('link')).toHaveAttribute('href', 'https://www.test.nl');
    expect(await screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

});
