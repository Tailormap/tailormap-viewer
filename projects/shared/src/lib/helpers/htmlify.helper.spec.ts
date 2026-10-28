import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HtmlifyHelper } from './htmlify.helper';

const link = (url: string, label = url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const imageLink = (url: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" alt="${url}"></a>`;

describe('HtmlifyHelper', () => {

  let sanitizer: DomSanitizer;
  beforeEach(() => {
    sanitizer = TestBed.inject(DomSanitizer);
  });

  const htmlifyContents = (text: string) => HtmlifyHelper.htmlifyContents(text, sanitizer);

  const expectPlainText = (text: string) => {
    const container = document.createElement('div');
    container.innerHTML = htmlifyContents(text);
    expect(container.children.length).toEqual(0);
    expect(container.textContent).toEqual(text);
  };

  it('prevents XSS/HTML injection', async () => {
    expectPlainText('<script>alert("test");</script>');
    expectPlainText('<img src=x onerror=alert(1)>');
    expectPlainText('https://javascript:alert(\'test\')');
  });

  it('escapes quotes in hrefs', async () => {
    const container = document.createElement('div');
    container.innerHTML = htmlifyContents('https://test.nl/"onClick="alert(\'test\')');
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toEqual('https://test.nl/"onClick="alert(\'test\')');
    expect(anchor?.getAttribute('onclick')).toBeNull();
  });

  it('only allows http and https destinations for MD-links', async () => {
    expectPlainText('[click](javascript:alert(1))');
    expectPlainText('[click](JaVaScRiPt:alert(1))');
    expectPlainText('[click](data:text/html;base64,PHNjcmlwdD4=)');
    expectPlainText('[click](vbscript:msgbox)');
    expectPlainText('[click](//evil.example)');
    expectPlainText('[click](not a url)');
    expectPlainText('[click](https://test.nl" onclick="alert(1))');
    expect(htmlifyContents('[<img src=x onerror=alert(1)>](https://test.nl)'))
      .toEqual(link('https://test.nl', '&lt;img src=x onerror=alert(1)&gt;'));
  });

  it('returns structured nodes', async () => {
    expect(HtmlifyHelper.getNodes('Text [link](https://test.nl) and\nhttps://test.nl/a.png [bad](javascript:x)')).toEqual([
      { type: 'text', text: 'Text ' },
      { type: 'link', href: 'https://test.nl', label: 'link', image: false },
      { type: 'text', text: ' and' },
      { type: 'linebreak' },
      { type: 'link', href: 'https://test.nl/a.png', label: 'https://test.nl/a.png', image: true },
      { type: 'text', text: ' [bad](javascript:x)' },
    ]);
    expect(HtmlifyHelper.getNodes(null)).toEqual([]);
  });

  it('validates urls', async () => {
    expect(HtmlifyHelper.getSafeUrl('https://test.nl')).toEqual('https://test.nl');
    expect(HtmlifyHelper.getSafeUrl(' HTTP://test.nl ')).toEqual('HTTP://test.nl');
    expect(HtmlifyHelper.getSafeUrl('javascript:alert(1)')).toBeNull();
    expect(HtmlifyHelper.getSafeUrl('mailto:test@test.nl')).toBeNull();
    expect(HtmlifyHelper.getSafeUrl('/relative')).toBeNull();
    expect(HtmlifyHelper.getSafeUrl('')).toBeNull();
  });

  it('renders back normal text', async () => {
    expect(htmlifyContents('Some text')).toEqual('Some text');
    expect(htmlifyContents('')).toEqual('');
  });

  it('transforms urls into hyperlinks', async () => {
    expect(htmlifyContents('Some text with some https://www.test.nl in it'))
      .toEqual(`Some text with some ${link('https://www.test.nl')} in it`);
    expect(htmlifyContents('Query https://www.test.nl/?a=1&b=2 in it'))
      .toEqual(`Query ${link('https://www.test.nl/?a=1&amp;b=2')} in it`);
  });

  it('transforms images into image tags', async () => {
    const content = [
      'Some text with some https://www.test.nl/image.jpg in it',
      'Some text with some https://www.test.nl/image.jpeg in it',
      'Some text with some https://www.test.nl/image.png in it',
      'Some text with some https://www.test.nl/image.svg in it',
      'Some text with some https://www.test.nl/image.webp in it',
      'Some text with some https://www.test.nl/image.gif in it',
      'Some text with a vendor specific image inside https://www.test.nl/getimage.ashx?id=testtest in it',
      'Some text with a plain link in it https://www.test.nl',
    ].join(' ');
    const expected = [
      `Some text with some ${imageLink('https://www.test.nl/image.jpg')} in it`,
      `Some text with some ${imageLink('https://www.test.nl/image.jpeg')} in it`,
      `Some text with some ${imageLink('https://www.test.nl/image.png')} in it`,
      `Some text with some ${imageLink('https://www.test.nl/image.svg')} in it`,
      `Some text with some ${imageLink('https://www.test.nl/image.webp')} in it`,
      `Some text with some ${imageLink('https://www.test.nl/image.gif')} in it`,
      `Some text with a vendor specific image inside ${imageLink('https://www.test.nl/getimage.ashx?id=testtest')} in it`,
      `Some text with a plain link in it ${link('https://www.test.nl')}`,
    ].join(' ');
    expect(htmlifyContents(content)).toEqual(expected);
  });

  it('transforms MD-links into hyperlinks', async () => {
    expect(htmlifyContents('Some text with some [link](https://www.test1.nl) in it'))
      .toEqual(`Some text with some ${link('https://www.test1.nl', 'link')} in it`);
    expect(htmlifyContents('Some text with some [link description](https://www.test2.nl) in it'))
      .toEqual(`Some text with some ${link('https://www.test2.nl', 'link description')} in it`);
    expect(htmlifyContents('Allow single space between brackets [link description] (https://www.test2.nl) in it'))
      .toEqual(`Allow single space between brackets ${link('https://www.test2.nl', 'link description')} in it`);
    expect(htmlifyContents('Some text with some [link / description + 123](https://www.test3.nl) in it'))
      .toEqual(`Some text with some ${link('https://www.test3.nl', 'link / description + 123')} in it`);
    expect(htmlifyContents('Some text with some [link / description + (abc/234)](https://www.test4.nl) in it'))
      .toEqual(`Some text with some ${link('https://www.test4.nl', 'link / description + (abc/234)')} in it`);
    expect(htmlifyContents('Some text with some [link / description + [mytag] asdfsadf](https://www.test5.nl) in it'))
      .toEqual(`Some text with some ${link('https://www.test5.nl', 'link / description + [mytag] asdfsadf')} in it`);
    expect(htmlifyContents('Some text with two [link](https://www.test6.nl) and [link2](https://www.test7.nl) in it'))
      .toEqual(`Some text with two ${link('https://www.test6.nl', 'link')} and ${link('https://www.test7.nl', 'link2')} in it`);
  });

  it('transforms multiple links with whitespace', async () => {
    expect(htmlifyContents('Deze laag toont gegevens uit http://www.postgis.net/\r\n\r\nhttps://postgis.net/logos/postgis-logo.png'))
      .toEqual(`Deze laag toont gegevens uit ${link('http://www.postgis.net/')}<br><br>${imageLink('https://postgis.net/logos/postgis-logo.png')}`);
    expect(htmlifyContents('Deze laag toont gegevens uit http://www.postgis.net/ https://postgis.net/logos/postgis-logo.png'))
      .toEqual(`Deze laag toont gegevens uit ${link('http://www.postgis.net/')} ${imageLink('https://postgis.net/logos/postgis-logo.png')}`);
  });

});
