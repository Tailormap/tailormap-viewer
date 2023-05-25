import 'jest-preset-angular/setup-jest';
import './projects/app/src/polyfills';
import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';
import * as failOnConsole from 'jest-fail-on-console'

failOnConsole();

global.TextEncoder = TextEncoder
// @ts-ignore
global.TextDecoder = TextDecoder

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

jest.mock('jsts/org/locationtech/jts/io', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OL3Parser: class MockedParser {
    public inject() {}
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
