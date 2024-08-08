import { ConfirmDialogComponent } from './confirm-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCommonModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { render, screen } from '@testing-library/angular';

describe('ConfirmDialogComponent', () => {

  it('should create', async () => {
    await render(ConfirmDialogComponent, {
        imports: [
          NoopAnimationsModule,
          MatCommonModule,
          MatDialogModule,
          MatButtonModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: {} },
          { provide: MAT_DIALOG_DATA, useValue: { title: 'hoi', message: '' } },
        ],
      },
    );
    expect(await screen.findByText("hoi")).toBeInTheDocument();
  });

});
