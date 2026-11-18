import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LayerDescriptionDialogComponent } from './layer-description-dialog.component';

describe('LayerDescriptionDialogComponent', () => {

  test('should render title and description and close', async () => {
    const close = vi.fn();
    await render(LayerDescriptionDialogComponent, {
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'The Layer', description: 'The layer description' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    expect(screen.getByRole('heading', { name: 'The Layer' })).toBeInTheDocument();
    expect(await screen.findByText('The layer description')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(close).toHaveBeenCalled();
  });

});
