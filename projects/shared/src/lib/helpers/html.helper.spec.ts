import { HtmlHelper } from './html.helper';

describe('HtmlHelper', () => {

  test('creates element', () => {
    const el = HtmlHelper.createElement({
      textContent: 'TEST',
      nodeName: 'div',
      className: 'test-cls',
    });
    expect(el.innerHTML).toEqual('TEST');
    expect(el.nodeName.toLowerCase()).toEqual('div');
    expect(el.className).toEqual('test-cls');
  });

  test('creates element with children', () => {
    const el = HtmlHelper.createElement({
      nodeName: 'div', children: [{
        nodeName: 'div', children: [{
          nodeName: 'div', children: [{
            nodeName: 'div', className: 'sub-child-cls',
          }],
        }],
      }],
    });
    expect((el.firstChild?.firstChild?.firstChild as HTMLElement).className).toEqual('sub-child-cls');
  });

});
