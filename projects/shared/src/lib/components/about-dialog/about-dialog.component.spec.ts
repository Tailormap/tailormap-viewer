import { render, screen } from '@testing-library/angular';
import { AboutDialogComponent } from './about-dialog.component';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';

describe('AboutDialogComponent', () => {

  test('should render', async () => {
    const closeFn = jest.fn();
    await render(AboutDialogComponent, {
      imports: [MatProgressSpinnerModule],
      providers: [
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN',
          }),
        ),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: closeFn } },
      ],
    });
    const httpClientMock = TestBed.inject(HttpTestingController);
    const mockReq = httpClientMock.expectOne('/version.json');
    expect(mockReq.request.responseType).toEqual('json');
    mockReq.flush({
      "version": "11.1.2",
      "buildDate": "Wed Oct 25 2023 15:28:49 GMT+0200 (Central European Summer Time)",
      "addedPackages": [],
    });
    expect(await screen.findByText('11.1.2')).toBeInTheDocument();
    expect(await screen.findByText('Oct 25, 2023')).toBeInTheDocument();
    expect(await screen.findByText('1:28:49 PM')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Close'));
    expect(closeFn).toHaveBeenCalled();
  });

});
