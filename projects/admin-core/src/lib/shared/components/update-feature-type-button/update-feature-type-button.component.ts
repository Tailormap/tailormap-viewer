import { Component, ChangeDetectionStrategy, Input, DestroyRef, Output, EventEmitter } from '@angular/core';
import { ExtendedFeatureTypeModel } from '../../../catalog/models/extended-feature-type.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeatureTypeUpdateService } from '../../../catalog/services/feature-type-update.service';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-update-feature-type-button',
  templateUrl: './update-feature-type-button.component.html',
  styleUrls: ['./update-feature-type-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateFeatureTypeButtonComponent {

  @Input()
  public featureType: ExtendedFeatureTypeModel | null = null;

  @Output()
  public featureTypeUpdated = new EventEmitter<FeatureTypeModel>();

  constructor(
    private featureTypeUpdateService: FeatureTypeUpdateService,
    private destroyRef: DestroyRef,
  ) { }

  public updateFeatureTypeSetting($event: MouseEvent, featureType: ExtendedFeatureTypeModel) {
    $event.preventDefault();
    if (!featureType) {
      return;
    }
    this.featureTypeUpdateService.updateFeatureTypeSetting$(featureType.originalId, +featureType.featureSourceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updatedFeatureType => {
        if (updatedFeatureType) {
          this.featureTypeUpdated.emit(updatedFeatureType);
        }
      });
  }

}
