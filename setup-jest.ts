import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import '@angular/localize/init';
import './projects/app/src/polyfills';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import failOnConsole from 'jest-fail-on-console';

setupZoneTestEnv();

// Error is thrown because the JSDOM version Jest uses does not support @layer css construct, ignore for now
const allowedErrors = ['Could not parse CSS stylesheet'];
failOnConsole({
  silenceMessage: (msg) => allowedErrors.some(err => msg.includes(err)),
});

global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextDecoder = TextDecoder;

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

window.EventSource = window.EventSource || jest.fn().mockImplementation(() => ({
  close: jest.fn(),
}));

Element.prototype.scrollTo = Element.prototype.scrollTo || (() => {});

jest.mock('jsts/org/locationtech/jts/io', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OL3Parser: class MockedParser {
    public inject() {/*empty*/}
    public read(input: any) { return input; }
    public write(input: any) { return input; }
  },
}));

jest.mock('jsts/org/locationtech/jts/operation/buffer', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BufferOp: {
    bufferOp: (input: any) => input,
  },
}));
