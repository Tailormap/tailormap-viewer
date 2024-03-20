import { render, screen } from '@testing-library/angular';
import { ShareViewerDialogComponent } from './share-viewer-dialog.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatDialogRef } from '@angular/material/dialog';

describe('ShareViewerDialogComponent', () => {

  test('should render', async () => {
    await render(ShareViewerDialogComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
      ],
    });
    expect(screen.getByText('Share viewer'));
  });

});
