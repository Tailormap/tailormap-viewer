import { HtmlifyHelper } from './htmlify.helper';

describe('HtmlifyHelper', () => {

  it('prevents XSS/HTML injection', async () => {
    expect(HtmlifyHelper.htmlifyContents('<script>alert("test");</script>')).toEqual('&lt;script&gt;alert(&quot;test&quot;);&lt;/script&gt;');
    expect(HtmlifyHelper.htmlifyContents('https://test.nl"onClick="alert(\'test\')'))
      .toEqual('<a href="https://test.nl&quot;onClick=&quot;alert(&#x27;test&#x27;)" target="_blank">https://test.nl&quot;onClick=&quot;alert(&#x27;test&#x27;)</a>');
    expect(HtmlifyHelper.htmlifyContents('https://javascript:alert(\'test\')'))
      .toEqual('<a href="https://alert(&#x27;test&#x27;)" target="_blank">https://alert(&#x27;test&#x27;)</a>');
  });

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
    expect(HtmlifyHelper.htmlifyContents('Some text with some [link](https://www.test1.nl) in it'))
      .toEqual('Some text with some <a href="https://www.test1.nl" target="_blank">link</a> in it');
    expect(HtmlifyHelper.htmlifyContents('Some text with some [link description](https://www.test2.nl) in it'))
      .toEqual('Some text with some <a href="https://www.test2.nl" target="_blank">link description</a> in it');
    expect(HtmlifyHelper.htmlifyContents('Allow single space between brackets [link description] (https://www.test2.nl) in it'))
      .toEqual('Allow single space between brackets <a href="https://www.test2.nl" target="_blank">link description</a> in it');
    expect(HtmlifyHelper.htmlifyContents('Some text with some [link / description + 123](https://www.test3.nl) in it'))
      .toEqual('Some text with some <a href="https://www.test3.nl" target="_blank">link / description + 123</a> in it');
    expect(HtmlifyHelper.htmlifyContents('Some text with some [link / description + (abc/234)](https://www.test4.nl) in it'))
      .toEqual('Some text with some <a href="https://www.test4.nl" target="_blank">link / description + (abc/234)</a> in it');
    expect(HtmlifyHelper.htmlifyContents('Some text with some [link / description + [mytag] asdfsadf](https://www.test5.nl) in it'))
      .toEqual('Some text with some <a href="https://www.test5.nl" target="_blank">link / description + [mytag] asdfsadf</a> in it');
    expect(HtmlifyHelper.htmlifyContents('Some text with two [link](https://www.test6.nl) and [link2](https://www.test7.nl) in it'))
      .toEqual('Some text with two <a href="https://www.test6.nl" target="_blank">link</a> and <a href="https://www.test7.nl" target="_blank">link2</a> in it');
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
