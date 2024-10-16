import { HtmlifyHelper } from './htmlify.helper';

describe('HtmlifyHelper', () => {

  it('renders back normal text', async () => {
    expect(HtmlifyHelper.htmlifyContents('Some text')).toEqual('Some text');
  });

  it('transforms urls into hyperlinks', async () => {
    expect(HtmlifyHelper.htmlifyContents('Some text with some https://www.test.nl in it'))
      .toEqual('Some text with some <a href="https://www.test.nl" target="_blank">https://www.test.nl</a> in it');
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
      'Some text with some <a href="https://www.test.nl/image.jpg" target="_blank"><img src="https://www.test.nl/image.jpg" alt="https://www.test.nl/image.jpg" /></a> in it',
      'Some text with some <a href="https://www.test.nl/image.jpeg" target="_blank"><img src="https://www.test.nl/image.jpeg" alt="https://www.test.nl/image.jpeg" /></a> in it',
      'Some text with some <a href="https://www.test.nl/image.png" target="_blank"><img src="https://www.test.nl/image.png" alt="https://www.test.nl/image.png" /></a> in it',
      'Some text with some <a href="https://www.test.nl/image.svg" target="_blank"><img src="https://www.test.nl/image.svg" alt="https://www.test.nl/image.svg" /></a> in it',
      'Some text with some <a href="https://www.test.nl/image.webp" target="_blank"><img src="https://www.test.nl/image.webp" alt="https://www.test.nl/image.webp" /></a> in it',
      'Some text with some <a href="https://www.test.nl/image.gif" target="_blank"><img src="https://www.test.nl/image.gif" alt="https://www.test.nl/image.gif" /></a> in it',
      // eslint-disable-next-line max-len
      'Some text with a vendor specific image inside <a href="https://www.test.nl/getimage.ashx?id=testtest" target="_blank"><img src="https://www.test.nl/getimage.ashx?id=testtest" alt="https://www.test.nl/getimage.ashx?id=testtest" /></a> in it',
      'Some text with a plain link in it <a href="https://www.test.nl" target="_blank">https://www.test.nl</a>',
    ].join(' ');
    expect(HtmlifyHelper.htmlifyContents(content)).toEqual(expected);
  });

  it('transforms MD-links into hyperlinks', async () => {
    expect(HtmlifyHelper.htmlifyContents('Some text with some [link](https://www.test.nl) in it'))
      .toEqual('Some text with some <a href="https://www.test.nl" target="_blank">link</a> in it');
  });

  it('transforms multiple links with whitespace', async () => {
    expect(HtmlifyHelper.htmlifyContents('Deze laag toont gegevens uit http://www.postgis.net/\r\n\r\nhttps://postgis.net/logos/postgis-logo.png'))
      // eslint-disable-next-line max-len
      .toEqual('Deze laag toont gegevens uit <a href="http://www.postgis.net/" target="_blank">http://www.postgis.net/</a><br />\r\n<br />\r\n<a href="https://postgis.net/logos/postgis-logo.png" target="_blank"><img src="https://postgis.net/logos/postgis-logo.png" alt="https://postgis.net/logos/postgis-logo.png" /></a>');
    expect(HtmlifyHelper.htmlifyContents('Deze laag toont gegevens uit http://www.postgis.net/ https://postgis.net/logos/postgis-logo.png'))
      // eslint-disable-next-line max-len
      .toEqual('Deze laag toont gegevens uit <a href="http://www.postgis.net/" target="_blank">http://www.postgis.net/</a> <a href="https://postgis.net/logos/postgis-logo.png" target="_blank"><img src="https://postgis.net/logos/postgis-logo.png" alt="https://postgis.net/logos/postgis-logo.png" /></a>');
  });

});
