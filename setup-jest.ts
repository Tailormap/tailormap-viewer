import 'jest-preset-angular/setup-jest';
import '@angular/localize/init';
import './projects/app/src/polyfills';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import * as failOnConsole from 'jest-fail-on-console';

failOnConsole();

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
