import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { HtmlifyComponent } from './htmlify.component';

describe('HtmlifyComponent', () => {

  test('renders text, links, images and line breaks as nodes', async () => {
    const { container } = await render(HtmlifyComponent, {
      inputs: { text: 'Some [link](https://www.test.nl) text\nhttps://www.test.nl/image.png' },
    });
    const link = screen.getByRole('link', { name: 'link' });
    expect(link.getAttribute('href')).toEqual('https://www.test.nl');
    expect(link.getAttribute('target')).toEqual('_blank');
    expect(link.getAttribute('rel')).toEqual('noopener noreferrer');
    expect(screen.getByRole('img').getAttribute('src')).toEqual('https://www.test.nl/image.png');
    expect(container.querySelectorAll('br').length).toEqual(1);
    expect(container.textContent).toContain('Some link text');
  });

  test('renders markup and disallowed links as plain text', async () => {
    const { container } = await render(HtmlifyComponent, {
      inputs: { text: '<b>bold</b> [click](javascript:alert(1))' },
    });
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toEqual('<b>bold</b> [click](javascript:alert(1))');
  });

  test('renders non-string values', async () => {
    const { container } = await render(HtmlifyComponent, { inputs: { text: 42 } });
    expect(container.textContent).toEqual('42');
  });

});
