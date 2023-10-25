import { render, screen } from '@testing-library/angular';
import { AboutDialogComponent } from './about-dialog.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('AboutDialogComponent', () => {

  test('should render', async () => {
    const closeFn = jest.fn();
    await render(AboutDialogComponent, {
      imports: [ HttpClientTestingModule, MatProgressSpinnerModule ],
      providers: [{ provide: MatDialogRef, useValue: { close: closeFn } }],
    });
    const httpClientMock = TestBed.inject(HttpTestingController);
    const mockReq = httpClientMock.expectOne('/version.json');
    expect(mockReq.request.responseType).toEqual('json');
    mockReq.flush({
      "version": "11.1.2",
      "buildDate": "Wed Oct 25 2023 15:28:49 GMT+0200 (Central European Summer Time)",
    });
    expect(await screen.findByText('11.1.2')).toBeInTheDocument();
    expect(await screen.findByText('Oct 25, 2023')).toBeInTheDocument();
    expect(await screen.findByText('1:28:49 PM')).toBeInTheDocument();
    expect(await screen.findByText('Unknown')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Close'));
    expect(closeFn).toHaveBeenCalled();
  });

});
