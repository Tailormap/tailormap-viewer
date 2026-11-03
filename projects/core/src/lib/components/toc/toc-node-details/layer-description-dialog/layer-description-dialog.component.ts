import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { HtmlifyComponent, TooltipDirective } from '@tailormap-viewer/shared';

export interface LayerDescriptionDialogData {
  title: string;
  description: string;
}

/**
 * Shows the description of a layer in a dialog. Used when the layer is configured (in the catalog) to show its
 * description in a pop-up instead of inline in the layer details.
 */
@Component({
  selector: 'tm-layer-description-dialog',
  templateUrl: './layer-description-dialog.component.html',
  styleUrls: ['./layer-description-dialog.component.css'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose,
    MatIconButton,
    MatIcon,
    TooltipDirective,
    HtmlifyComponent,
  ],
})
export class LayerDescriptionDialogComponent {
  public static readonly TITLE_ID = 'layer-description-dialog-title';
  public data = inject<LayerDescriptionDialogData>(MAT_DIALOG_DATA);
  public titleId = LayerDescriptionDialogComponent.TITLE_ID;
}
