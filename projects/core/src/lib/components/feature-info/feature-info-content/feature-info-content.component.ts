import { Component, ChangeDetectionStrategy, input, signal, computed, inject, output } from '@angular/core';
import { FeatureInfoLayerModel, FeatureInfoModel } from '../models';
import { AttachmentService } from '../../../services';
import { FeatureSelectionBookmarkService } from '../../../services/application-bookmark/feature-selection-bookmark.service';
import { combineLatest, map, Observable, take } from 'rxjs';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { selectALlFiltersForAttribute } from '../../../state';
import { selectFeatureInfoMetadata } from '../state/feature-info.selectors';
import { AttributeType } from '@tailormap-viewer/api';
import { FeaturesFilterHelper, FilterTypeHelper } from '../../../filter';
import { Store } from '@ngrx/store';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';

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
  private store$ = inject(Store);
  private simpleAttributeFilterService = inject(SimpleAttributeFilterService);

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
            : $localize `:@@core.feature-info.share-feature-not-copied:Failed to copy link to clipboard`,
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

  public toggleFilter(att: {attributeValue: any; key: string; label: string}) {
    const currentFeature = this.currentFeature();
    const attributeValueString: string = String(att.attributeValue);
    this.getExactFilters$(currentFeature?.layer?.id ?? '', att.key, attributeValueString)
      .pipe(take(1))
      .subscribe(exactFilters => {
        if (exactFilters && exactFilters.length > 0) {
          for (const exactFilter of exactFilters) {
            this.simpleAttributeFilterService.removeFilterById("ATTRIBUTE_LIST", currentFeature?.layer?.id ?? '', exactFilter);
          }
        } else {
          this.createFilterFromFeatureInfo(currentFeature?.layer?.id ?? '', att.key, attributeValueString, att.label);
        }
      });
  }

  private createFilterFromFeatureInfo(
    layerId: string,
    attributeName: string,
    attributeValue: string,
    attributeAlias?: string,
  ) {
    this.store$.select(selectFeatureInfoMetadata).pipe(take(1))
      .subscribe( metadata => {
        const columnMetadata = metadata.columnMetadata
          .find(m => m.layerId === layerId && m.name === attributeName);
        const attributeType = columnMetadata?.type || AttributeType.STRING;
        const filter = FeaturesFilterHelper.createAttributeFilter(attributeName, attributeValue, attributeType, attributeAlias);
        this.simpleAttributeFilterService.setFilter("ATTRIBUTE_LIST", layerId, filter);
      });
  }

  public getExactFilters$(layerId: string, attribute: string, value: string):
    Observable<string[] | null> {
    return combineLatest([
      this.store$.select(selectALlFiltersForAttribute(layerId, attribute)),
      this.store$.select(selectFeatureInfoMetadata),
    ]).pipe(
      map(([ groups, metadata ]) => {
        const columnMetadata = metadata.columnMetadata
          .find(m => m.layerId === layerId && m.name === attribute);
        const attributeType = columnMetadata?.type ?? AttributeType.STRING;
        const equalsCondition = FeaturesFilterHelper.getEqualsCondition(attributeType, value);
        const attributeListFilterGroups = groups.filter(group => group.source === 'ATTRIBUTE_LIST');

        const exactFilters = FeaturesFilterHelper.findExactFiltersInGroups(
          attributeListFilterGroups,
          attribute,
          attributeType,
          value,
          equalsCondition,
        );

        return exactFilters.length > 0 ? exactFilters : null;
      }),
    );

  }

  public otherFilterExistsForAttribute$(layerId: string, attribute: string, value: string): Observable<boolean> {
    // Find if other filters exist for this attribute in groups with source 'ATTRIBUTE_LIST'.
    return combineLatest([
      this.store$.select(selectALlFiltersForAttribute(layerId, attribute)),
      this.store$.select(selectFeatureInfoMetadata),
    ]).pipe(
      map(([ groups, metadata ]) => {
        const columnMetadata = metadata.columnMetadata
          .find(m => m.layerId === layerId && m.name === attribute);
        const attributeType = columnMetadata?.type || AttributeType.STRING;
        const equalsCondition = FeaturesFilterHelper.getEqualsCondition(attributeType, value);
        const attributeListGroups = groups.filter(group => group.source === 'ATTRIBUTE_LIST');
        return attributeListGroups.some(group =>
          group.filters.some(filter =>
            FilterTypeHelper.isAttributeFilter(filter) &&
            (
              filter.condition !== equalsCondition ||
              filter.value[0] !== value
            ),
          ),
        );
      }),
    );
  }

  public getFilterButtonTooltip$(layerId: string, attribute: string, value: string): Observable<string> {
    return combineLatest([
      this.getExactFilters$(layerId, attribute, value),
      this.otherFilterExistsForAttribute$(layerId, attribute, value),
    ]).pipe(
      map(([ exactFilters, otherFilterExists ]) => {
        if (exactFilters) {
          return $localize `:@@core.feature-info.filter-off-tooltip:Remove filter for this value`;
        }
        if (otherFilterExists) {
          return $localize `:@@core.feature-info.other-filter-exists-tooltip:There is another filter for this attribute`;
        }
        return $localize `:@@core.feature-info.filter-tooltip:Filter on this value`;
      }),
    );
  }

  public exactFilterEnabled$(layerId: string, attribute: string, value: string): Observable<boolean> {
    return this.getExactFilters$(layerId, attribute, value).pipe(
      map(exactFilters =>
        !!exactFilters && exactFilters?.length > 0),
    );
  }

  public getFilterButtonDisabled$(layerId: string, attribute: string, value: string): Observable<boolean> {
    return combineLatest([
      this.otherFilterExistsForAttribute$(layerId, attribute, value),
      this.exactFilterEnabled$(layerId, attribute, value),
    ]).pipe(
      map(([ otherFilterExists, exactFilterEnabled ]) => {
        return otherFilterExists && !exactFilterEnabled;
      }),
    );
  }
}
