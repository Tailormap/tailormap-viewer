import { inject, Service } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  LayerDescriptionDialogComponent, LayerDescriptionDialogData,
} from '../toc-node-details/layer-description-dialog/layer-description-dialog.component';

/**
 * Opens the description of a layer in a dialog, shared by the desktop and mobile layer details.
 */
@Service()
export class LayerDescriptionDialogService {

  private dialog = inject(MatDialog);

  public open(title: string, description: string): MatDialogRef<LayerDescriptionDialogComponent> {
    return this.dialog.open<LayerDescriptionDialogComponent, LayerDescriptionDialogData>(LayerDescriptionDialogComponent, {
      data: { title, description },
      ariaLabelledBy: LayerDescriptionDialogComponent.TITLE_ID,
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
    });
  }

}
