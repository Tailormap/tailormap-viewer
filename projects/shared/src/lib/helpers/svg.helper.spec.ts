import { describe, test, expect } from 'vitest';
import { SvgHelper } from './svg.helper';

describe('SvgHelper', () => {

  test('returns empty string for empty input', () => {
    expect(SvgHelper.getCleanSvg('')).toEqual('');
    expect(SvgHelper.getCleanSvg(undefined as unknown as string)).toEqual('');
    expect(SvgHelper.getCleanSvg(null as unknown as string)).toEqual('');
  });

  test('keeps valid svg content', () => {
    const svg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
      + '<circle cx="12" cy="12" r="9" stroke-dasharray="0" style="stroke: rgb(255, 0, 0);"></circle>'
      + '</svg>';
    const result = SvgHelper.getCleanSvg(svg);
    expect(result).toContain('<svg');
    expect(result).toContain('viewBox="0 0 24 24"');
    expect(result).toContain('<circle');
    expect(result).toContain('r="9"');
    expect(result).toContain('stroke-dasharray="0"');
    expect(result).toContain('style="stroke: rgb(255, 0, 0);"');
  });

  test('keeps svg filters', () => {
    const svg = '<svg><filter id="f1"><feGaussianBlur stdDeviation="5"></feGaussianBlur></filter><rect filter="url(#f1)"></rect></svg>';
    const result = SvgHelper.getCleanSvg(svg);
    expect(result).toContain('<filter');
    expect(result).toContain('<feGaussianBlur');
  });

  test('removes script tags', () => {
    const result = SvgHelper.getCleanSvg('<svg><script>alert(1)</script><rect></rect></svg>');
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toContain('<rect');
  });

  test('removes event handler attributes', () => {
    const result = SvgHelper.getCleanSvg('<svg onload="alert(1)"><rect onclick="alert(2)" onmouseover="alert(3)"></rect></svg>');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onmouseover');
    expect(result).not.toContain('alert');
  });

  test('removes foreignObject', () => {
    const result = SvgHelper.getCleanSvg('<svg><foreignObject><div><img src="x" onerror="alert(1)"></div></foreignObject></svg>');
    expect(result).not.toContain('foreignObject');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  test('removes use elements', () => {
    const result = SvgHelper.getCleanSvg('<svg><use href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=#x"></use></svg>');
    expect(result).not.toContain('<use');
    expect(result).not.toContain('data:image');
  });

  test('removes javascript urls', () => {
    const result = SvgHelper.getCleanSvg('<svg><a href="javascript:alert(1)"><rect></rect></a></svg>');
    expect(result).not.toContain('javascript:');
  });

  test('removes html content which is not svg', () => {
    const result = SvgHelper.getCleanSvg('<svg><rect></rect></svg><iframe src="https://example.com"></iframe>');
    expect(result).not.toContain('iframe');
    expect(result).toContain('<rect');
  });

  describe('with node input', () => {

    const svgNs = 'http://www.w3.org/2000/svg';

    const parseSvg = (svg: string): Node => {
      return new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    };

    test('keeps valid svg content', () => {
      const svg = document.createElementNS(svgNs, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const circle = document.createElementNS(svgNs, 'circle');
      circle.setAttribute('r', '9');
      circle.setAttribute('style', 'stroke: rgb(255, 0, 0);');
      svg.appendChild(circle);
      const result = SvgHelper.getCleanSvg(svg);
      expect(result).toContain('<svg');
      expect(result).toContain('viewBox="0 0 24 24"');
      expect(result).toContain('<circle');
      expect(result).toContain('r="9"');
      expect(result).toContain('style="stroke: rgb(255, 0, 0);"');
    });

    test('removes script tags', () => {
      const svg = document.createElementNS(svgNs, 'svg');
      const script = document.createElementNS(svgNs, 'script');
      script.textContent = 'alert(1)';
      svg.appendChild(script);
      svg.appendChild(document.createElementNS(svgNs, 'rect'));
      const result = SvgHelper.getCleanSvg(svg);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
      expect(result).toContain('<rect');
    });

    test('removes event handler attributes', () => {
      const svg = document.createElementNS(svgNs, 'svg');
      svg.setAttribute('onload', 'alert(1)');
      const rect = document.createElementNS(svgNs, 'rect');
      rect.setAttribute('onclick', 'alert(2)');
      svg.appendChild(rect);
      const result = SvgHelper.getCleanSvg(svg);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    test('removes foreignObject and use from parsed svg', () => {
      const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg">'
        + '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></div></foreignObject>'
        + '<use href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=#x"/>'
        + '<rect/>'
        + '</svg>');
      const result = SvgHelper.getCleanSvg(svg);
      expect(result).not.toContain('foreignObject');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<use');
      expect(result).toContain('<rect');
    });

    test('removes javascript urls', () => {
      const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>');
      expect(SvgHelper.getCleanSvg(svg)).not.toContain('javascript:');
    });

    test('does not modify the original node', () => {
      const svg = document.createElementNS(svgNs, 'svg');
      svg.setAttribute('onload', 'alert(1)');
      SvgHelper.getCleanSvg(svg);
      expect(svg.getAttribute('onload')).toEqual('alert(1)');
    });

  });

  test('removes script nested inside svg elements', () => {
    const result = SvgHelper.getCleanSvg('<svg><rect style="fill: red;"><script>alert(1)</script></rect></svg>');
    expect(result).not.toContain('script');
    expect(result).toContain('style="fill: red;"');
  });

});
