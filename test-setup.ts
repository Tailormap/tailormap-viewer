import './projects/app/src/polyfills';
import 'zone.js/testing';
import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';
import { vi, beforeEach } from "vitest";
import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

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

const createMockStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
};

const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

Element.prototype.scrollTo = Element.prototype.scrollTo || (() => {});

// Registers a fake MatIconRegistry for every test so `<mat-icon svgIcon="...">` never tries to
// fetch a real SVG over HttpClient (which logs a "Error retrieving icon" console error for any
// icon name that isn't registered in the test). Runs before each test's own `TestBed.configureTestingModule`
// call (e.g. via `render(...)` from @testing-library/angular), which merges its `imports` into this
// one - so specs no longer need to import `MatIconTestingModule` themselves, though doing so is
// still harmless.
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [MatIconTestingModule],
    providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
  });
});

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
