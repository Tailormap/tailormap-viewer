import { render, screen } from '@testing-library/angular';
import { ImageWithDescriptionComponent } from './image-with-description.component';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('ImageWithDescriptionComponent', () => {

  const logoUrl = '/mock-path/logo.png';

  const setup = async () => {
    const renderResult = await render(ImageWithDescriptionComponent, {
      providers: [ provideHttpClient(), provideHttpClientTesting() ],
      inputs: { src: logoUrl },
    });
    const httpMock = renderResult.debugElement.injector.get(HttpTestingController);
    return { ...renderResult, httpMock };
  };

  test('should render image with aria-label from tm-description header', async () => {
    const { fixture, httpMock } = await setup();

    httpMock.expectOne(logoUrl).flush(
      new Blob(['image'], { type: 'image/png' }),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { headers: { 'tm-description': 'Company logo' } },
    );
    fixture.detectChanges();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('aria-label', 'Company logo');
    expect(img).toHaveAttribute('alt', 'Company logo');

    httpMock.verify();
  });

  test('should use default aria-label when tm-description header is absent', async () => {
    const { fixture, httpMock } = await setup();

    httpMock.expectOne(logoUrl).flush(new Blob(['image'], { type: 'image/png' }));
    fixture.detectChanges();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('aria-label', 'Logo');
    expect(img).toHaveAttribute('alt', 'Logo');

    httpMock.verify();
  });

});
