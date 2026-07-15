import { Component, ChangeDetectionStrategy, input, signal, computed, inject, output } from '@angular/core';
import { FeatureInfoLayerModel, FeatureInfoModel } from '../models';
import { AttachmentService } from '../../../services';
import { FeatureSelectionBookmarkService } from '../../../services/application-bookmark/feature-selection-bookmark.service';
import { take } from 'rxjs';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'tm-feature-info-content',
  templateUrl: './feature-info-content.component.html',
  styleUrls: ['./feature-info-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoContentComponent {
  public attachmentHelper = inject(AttachmentService);
  public featureSelectionBookmarkService = inject(FeatureSelectionBookmarkService);
  public snackBar = inject(MatSnackBar);
  private clipboard = inject(Clipboard);

  public selectedLayer = input<FeatureInfoLayerModel | null>(null);
  public currentFeature = input<FeatureInfoModel | null>(null);
  public isPrevButtonDisabled = input<boolean>(false);
  public isNextButtonDisabled = input<boolean>(false);
  public isEditPossible = input<boolean>(false);
  public hideEmptyValues = input<boolean>(false);

  public showNextFeatureInfoFeature = output<void>();
  public showPreviousFeatureInfoFeature = output<void>();
  public editFeature = output<void>();

  public attributesCollapsed = signal<boolean>(false);
  public attributesToggleIcon = computed(() => this.attributesCollapsed() ? 'chevron_top' : 'chevron_bottom');
  public attachmentsCollapsed = signal<boolean>(false);
  public attachmentsToggleIcon = computed(() => this.attachmentsCollapsed() ? 'chevron_top' : 'chevron_bottom');

  public next() {
    if (!this.isNextButtonDisabled()) {
      this.showNextFeatureInfoFeature.emit();
    }
  }

  public back() {
    if (!this.isPrevButtonDisabled()) {
      this.showPreviousFeatureInfoFeature.emit();
    }
  }

  public editFeatureClicked() {
    this.editFeature.emit();
  }

  public toggleAttributes() {
    this.attributesCollapsed.set(!this.attributesCollapsed());
  }

  public toggleAttachments() {
    this.attachmentsCollapsed.set(!this.attachmentsCollapsed());
  }

  public shareFeatureClicked() {
    this.featureSelectionBookmarkService.getFidSelectionUrl$(this.currentFeature()?.layer?.id ?? '', this.currentFeature()?.__fid ?? '')
      .pipe(take(1))
      .subscribe((url) => {
        if (url) {
          const copied = this.clipboard.copy(url);
          this.showSnackbarMessage(copied
            ? $localize `:@@core.feature-info.share-feature-copied:Link copied to clipboard`
            : $localize `:@@core.feature-info.share-feature-not-copied:Failed to copy link to clipboard`
          );
        }
      });
  }

  private showSnackbarMessage(msg: string) {
    const config: SnackBarMessageOptionsModel = {
      message: msg,
      duration: 5000,
      showDuration: true,
      showCloseButton: true,
    };
    SnackBarMessageComponent.open$(this.snackBar, config).subscribe();
  }

  public shouldShowAttribute(att: { label: string; attributeValue: any; key: string }) {
    if (!this.hideEmptyValues()) {
      return true;
    }
    if (att.attributeValue === null) {
      return false;
    }
    if (typeof att.attributeValue === 'string' && (att.attributeValue as string).trim() === '') {
      return false;
    }
    return true;
  }
}
