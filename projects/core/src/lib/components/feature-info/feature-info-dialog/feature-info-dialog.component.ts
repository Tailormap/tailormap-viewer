import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFeatureInfo, selectFeatureInfoDialogVisible } from '../state/feature-info.selectors';
import { map, Observable, of, Subject, takeUntil } from 'rxjs';
import { hideFeatureInfoDialog } from '../state/feature-info.actions';
import { FeatureInfoModel } from '../models/feature-info.model';
import { ColumnMetadataModel, FeatureModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoDialogComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public dialogOpen$: Observable<boolean> = of(false);

  public featureInfo: FeatureInfoModel[] = [];
  private currentSelected: [number, number] = [0, 0];

  public currentFeatureInfo: FeatureInfoModel | null = null;
  private currentFeature: FeatureModel | null = null;
  private currentMetaData: Map<string, ColumnMetadataModel> = new Map();

  constructor(
    private store$: Store,
  ) {}

  public ngOnInit(): void {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.store$.select(selectFeatureInfo)
      .pipe(takeUntil(this.destroyed))
      .subscribe(featureInfo => {
        this.featureInfo = featureInfo;
        this.currentSelected = [0, 0];
        this.setCurrentFeature();
      });
  }

  private setCurrentFeature() {
    if (this.featureInfo.length > 0) {
      this.currentFeatureInfo = this.featureInfo[this.currentSelected[0]];
      this.currentFeature = this.currentFeatureInfo?.features[this.currentSelected[1]] || null;
      this.currentMetaData = new Map((this.currentFeatureInfo.columnMetadata || []).map(c => [c.key, c]));
    }
  }

  public next() {
    if (this.currentFeatureInfo?.features[this.currentSelected[1] + 1]) {
      // next feature for current layer
      this.currentSelected = [this.currentSelected[0], this.currentSelected[1] + 1];
    } else if (this.featureInfo[this.currentSelected[0] + 1]) {
      this.currentSelected = [this.currentSelected[0] + 1, 0];
    } else {
      this.currentSelected = [0, 0];
    }
    this.setCurrentFeature();
  }

  public back() {
    if (this.currentSelected[1] > 0) {
      // next feature for current layer
      this.currentSelected = [this.currentSelected[0], this.currentSelected[1] - 1];
    } else if (this.currentSelected[0] > 0) {
      const nextIdx = this.currentSelected[0] - 1;
      this.currentSelected = [nextIdx, this.featureInfo[nextIdx]?.features.length - 1 || 0];
    } else {
      this.currentSelected = [0, 0];
    }
    this.setCurrentFeature();
  }

  public closeDialog() {
    this.store$.dispatch(hideFeatureInfoDialog());
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getAttributes(): Record<string, string | boolean | number | null> {
    if (!this.currentFeature) {
      return {};
    }
    return this.currentFeature.attributes;
  }

  public getAlias(prop: string): string {
    return this.currentMetaData.get(prop)?.alias || prop;
  }

}
