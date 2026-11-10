import { describe, test, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MarkdownHelper } from './markdown.helper';

const renderMarkdown = async (md: string, resolveImageUrl?: (url: string) => string): Promise<string> => {
  const sanitizer = TestBed.inject(DomSanitizer);
  const safeHtml: SafeHtml = await firstValueFrom(MarkdownHelper.getSafeHtmlForMarkdown$(md, sanitizer, resolveImageUrl));
  return sanitizer.sanitize(SecurityContext.HTML, safeHtml) ?? '';
};

describe('MarkdownHelper', () => {

  test('escapes markdown', () => {
    expect(MarkdownHelper.markdownEscape('123')).toEqual('123');
    expect(MarkdownHelper.markdownEscape(123)).toEqual('123');
    expect(MarkdownHelper.markdownEscape(true)).toEqual('true');
    expect(MarkdownHelper.markdownEscape(null)).toEqual(null);
    expect(MarkdownHelper.markdownEscape('* _123_')).toEqual('\\* \\_123\\_');
    expect(MarkdownHelper.markdownEscape('___ abc # test ## test2')).toEqual('\\_\\_\\_ abc \\# test \\#\\# test2');
  });

  test('parses template and replaces variables', () => {
    const variables = new Map([
      [ 'var1', 'Some value' ],
      [ 'var2', 'Value 2' ],
      [ 'var3', 'Other one' ],
    ]);
    const template = 'Some story about {{var1}}. {{ var2 }} should be replaced. {{ Leave this {{ var3 }} and this }}';
    const result = MarkdownHelper.templateParser(template, variables);
    expect(result).toEqual('Some story about Some value. Value 2 should be replaced. {{ Leave this Other one and this }}');
  });

  test('parses template and fixes white space in urls', () => {
    const variables = new Map([
      [ 'var1', 'Some value' ],
      [ 'var2', 'Value 2' ],
      [ 'var3', 'Other one' ],
      [ 'var4', null ],
      [ 'filename', 'my doc.pdf' ],
    ]);
    // eslint-disable-next-line max-len
    const template = 'Some story about {{var1}}. {{ var2 }} should be replaced. {{ Leave this {{ var3 }} and this }}. {{var4}}[Do add a link though](https://www.test.nl/{{filename}})';
    const result = MarkdownHelper.templateParser(template, variables);
    expect(result)
      .toEqual('Some story about Some value. Value 2 should be replaced. {{ Leave this Other one and this }}. [Do add a link though](https://www.test.nl/my%20doc.pdf)');
  });

  test('renders bare urls as links opening in a new window', async () => {
    const html = await renderMarkdown('See https://www.test.nl/page');
    expect(html).toContain('<a href="https://www.test.nl/page" target="_blank" rel="noopener noreferrer">https://www.test.nl/page</a>');
  });

  test('renders bare image urls as images', async () => {
    const html = await renderMarkdown('https://www.test.nl/image.png');
    expect(html).toContain('<a href="https://www.test.nl/image.png" target="_blank" rel="noopener noreferrer"><img src="https://www.test.nl/image.png"');
  });

  test('renders regular markdown links normally', async () => {
    const html = await renderMarkdown('[Test](https://www.test.nl/)');
    expect(html).toContain('<a href="https://www.test.nl/">Test</a>');
  });

  test('resolves image urls when resolveImageUrl is given', async () => {
    const html = await renderMarkdown('![alt](upload://abc)', url => url.replace('upload://', 'https://www.test.nl/uploads/'));
    expect(html).toContain('<img src="https://www.test.nl/uploads/abc" alt="alt">');
  });

});
