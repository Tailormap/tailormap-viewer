import '@angular/localize/init';
import './projects/app/src/polyfills';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import * as failOnConsole from 'jest-fail-on-console';
import { getTestBed, TestBed } from '@angular/core/testing';
import { ErrorHandler, NgModule, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

const testEnvironmentOptions = (globalThis as any).ngJest?.testEnvironmentOptions ?? Object.create(null);

@NgModule({
  providers: [
    provideExperimentalZonelessChangeDetection(),
    {
      provide: ErrorHandler,
      useValue: {
        handleError: (e: any) => {
          throw e;
        },
      },
    },
  ],
})
export class TestModule {}

getTestBed().initTestEnvironment(
  [ BrowserDynamicTestingModule, TestModule ],
  platformBrowserDynamicTesting(),
  testEnvironmentOptions,
);

TestBed.configureTestingModule({  providers: [provideExperimentalZonelessChangeDetection()] });

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
