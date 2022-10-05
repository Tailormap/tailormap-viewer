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

  it('transforms images into image tags', async () => {
    const content = [
      'Some text with some https://www.test.nl/image.jpg in it',
      'Some text with some https://www.test.nl/image.jpeg in it',
      'Some text with some https://www.test.nl/image.png in it',
      'Some text with some https://www.test.nl/image.webp in it',
      'Some text with some https://www.test.nl/image.gif in it',
      'Some text with a vendor specific image inside https://www.test.nl/getimage.ashx?id=testtest in it',
      'Some text with a plain link in it https://www.test.nl',
    ].join(' ');
    await render(`<div tmTransformUrls>${content}</div>`, {
      declarations: [TransformUrlsDirective],
    });
    expect(await screen.getAllByRole('img').length).toEqual(6);
    expect(await screen.getAllByRole('link').length).toEqual(7);
    expect(await screen.getAllByRole('img')[0]).toHaveAttribute('src', 'https://www.test.nl/image.jpg');
    expect(await screen.getAllByRole('link')[0]).toHaveAttribute('href', 'https://www.test.nl/image.jpg');
    expect(await screen.getAllByRole('link')[6]).toHaveAttribute('href', 'https://www.test.nl');
  });

});
