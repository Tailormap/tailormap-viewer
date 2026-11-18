import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MarkdownToHtmlPipe, TooltipDirective } from '@tailormap-viewer/shared';
import { AsyncPipe } from '@angular/common';

export interface LayerDescriptionDialogData {
  title: string;
  description: string;
}

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
    AsyncPipe,
    MarkdownToHtmlPipe,
  ],
})
export class LayerDescriptionDialogComponent {
  public data = inject<LayerDescriptionDialogData>(MAT_DIALOG_DATA);
}
