import '@angular/localize/init';
import './projects/app/src/polyfills';
import 'zone.js/testing';
import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';
import { vi } from "vitest";
// Error is thrown because the JSDOM version Jest uses does not support @layer css construct, ignore for now
// const allowedErrors = ['Could not parse CSS stylesheet'];
// failOnConsole({
//   silenceMessage: (msg) => allowedErrors.some(err => msg.includes(err)),
// });

global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextDecoder = TextDecoder;

window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn(class {
    public disconnect = vi.fn();
    public observe = vi.fn();
    public unobserve = vi.fn();
  });

window.IntersectionObserver =
  window.IntersectionObserver ||
  vi.fn(class {
    public disconnect = vi.fn();
    public observe = vi.fn();
    public unobserve = vi.fn();
  });

window.EventSource = window.EventSource || vi.fn(class {
  public close = vi.fn();
});

Element.prototype.scrollTo = Element.prototype.scrollTo || (() => {});

vi.mock('jsts/org/locationtech/jts/io', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WKTReader: class MockedWKTReader {
    public read(input: string) {
      return input;
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WKTWriter: class MockedWKTWriter {
    public write(input: string) {
      return input;
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OL3Parser: class MockedParser {
    public inject() {/*empty*/}
    public read(input: any) { return input; }
    public write(input: any) { return input; }
  },
}));

vi.mock('jsts/org/locationtech/jts/operation/buffer', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BufferOp: {
    bufferOp: (input: any) => input,
  },
}));
