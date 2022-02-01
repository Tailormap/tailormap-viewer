import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFeatureInfo, selectFeatureInfoDialogCollapsed, selectFeatureInfoDialogVisible } from '../state/feature-info.selectors';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { expandCollapseFeatureInfoDialog, hideFeatureInfoDialog } from '../state/feature-info.actions';
import { AppLayerModel, ColumnMetadataModel, FeatureModel } from '@tailormap-viewer/api';

export interface DialogFeatureInfoModel {
  feature: FeatureModel;
  columnMetadata: Map<string, ColumnMetadataModel>;
  layer: AppLayerModel;
}

@Component({
  selector: 'tm-feature-info-dialog',
  templateUrl: './feature-info-dialog.component.html',
  styleUrls: ['./feature-info-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoDialogComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public dialogOpen$: Observable<boolean> = of(false);
  public dialogCollapsed$: Observable<boolean> = of(false);

  public featureInfo: DialogFeatureInfoModel[] = [];
  public currentSelected = 0;

  constructor(
    private store$: Store,
  ) {}

  public ngOnInit(): void {
    this.dialogOpen$ = this.store$.select(selectFeatureInfoDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectFeatureInfoDialogCollapsed);
    this.store$.select(selectFeatureInfo)
      .pipe(takeUntil(this.destroyed))
      .subscribe(featureInfo => {
        this.featureInfo = [];
        this.currentSelected = 0;
        featureInfo.forEach(info => {
          const columnMetadata = new Map((info.columnMetadata || []).map(c => [c.key, c]));
          info.features.forEach(f => {
            this.featureInfo.push({
              feature: f,
              columnMetadata,
              layer: info.layer,
            });
          });
        });
      });
  }

  public next() {
    if (this.featureInfo[this.currentSelected + 1]) {
      this.currentSelected++;
      return;
    }
    this.currentSelected = 0;
  }

  public back() {
    if (this.currentSelected > 0) {
      this.currentSelected--;
      return;
    }
    this.currentSelected = this.featureInfo.length - 1;
  }

  public isFirstItem() {
    return this.currentSelected === 0;
  }

  public isLastItem() {
    return this.currentSelected === this.featureInfo.length - 1;
  }

  public closeDialog() {
    this.store$.dispatch(hideFeatureInfoDialog());
  }

  public expandCollapseDialog() {
    this.store$.dispatch(expandCollapseFeatureInfoDialog());
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getAttributes(): Record<string, string | boolean | number | null> {
    if (!this.featureInfo[this.currentSelected]) {
      return {};
    }
    return this.featureInfo[this.currentSelected].feature.attributes;
  }

  public getAlias(prop: string): string {
    return this.featureInfo[this.currentSelected].columnMetadata.get(prop)?.alias || prop;
  }

}
