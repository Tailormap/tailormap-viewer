import { render, screen } from '@testing-library/angular';
import { LanguageToggleComponent } from './language-toggle.component';
import { APP_BASE_HREF } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const hrefGetMock = vi.fn();
const hrefSetMock = vi.fn();

const setup = async (baseHref: string, locale: string, currentHref?: string) => {
  if (currentHref) {
    hrefGetMock.mockImplementation(() => currentHref);
  }
  return await render(LanguageToggleComponent, {
    providers: [
      { provide: APP_BASE_HREF, useValue: baseHref },
      { provide: LOCALE_ID, useValue: locale },
    ],
    imports: [ MatIconTestingModule, NoopAnimationsModule ],
  });
};

describe('LanguageToggleComponent', () => {

  beforeAll(() => {
    // @ts-expect-error deleting location is allowed in testing env, restored after tests
    delete window.location;
    // @ts-expect-error overwriting location is allowed in testing env, restored after tests
    window.location = Object.defineProperty({}, 'href', {
      get: hrefGetMock,
      set: hrefSetMock,
    });
  });

  afterAll(() => {
    // @ts-expect-error restoring the original location object after overwriting it above
    window.location = location;
  });

  beforeEach(() => {
    hrefGetMock.mockClear();
    hrefSetMock.mockClear();
  });

  test('should render nothing without language in base href', async () => {
    const { container } = await setup('', '');
    expect(container).toBeEmptyDOMElement();
  });

  test('should render toggle', async () => {
    await setup('/en', 'en', '/en/app/some-app#@234,456');
    expect(await screen.findByText('English')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('English'));
    expect(await screen.findByText('Nederlands')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Nederlands'));
    expect(hrefSetMock).toHaveBeenCalledWith('/nl/app/some-app#@234,456');
  });

  test('should not change the href in case the language is different', async () => {
    await setup('/en', 'en', '/fr/app/some-app#@234,456');
    expect(await screen.findByText('English')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('English'));
    expect(await screen.findByText('Nederlands')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Nederlands'));
    expect(hrefSetMock).toHaveBeenCalledWith('/fr/app/some-app#@234,456');
  });

});
