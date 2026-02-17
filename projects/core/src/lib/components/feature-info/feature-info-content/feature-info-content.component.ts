import { Component, ChangeDetectionStrategy, input, signal, computed, inject, output } from '@angular/core';
import { FeatureInfoLayerModel, FeatureInfoModel } from '../models';
import { AttachmentService } from '../../../services';

@Component({
  selector: 'tm-feature-info-content',
  templateUrl: './feature-info-content.component.html',
  styleUrls: ['./feature-info-content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureInfoContentComponent {
  public attachmentHelper = inject(AttachmentService);


  public selectedLayer = input<FeatureInfoLayerModel | null>(null);
  public currentFeature = input<FeatureInfoModel | null>(null);
  public isPrevButtonDisabled = input<boolean>(false);
  public isNextButtonDisabled = input<boolean>(false);
  public isEditPossible = input<boolean>(false);

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
}
