import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { selectFeatureInfoLayers, selectSelectedLayerId } from '../state/feature-info.selectors';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map, tap } from 'rxjs';
import { FeatureInfoLayerModel } from '../models/feature-info-layer.model';
import { setSelectedFeatureInfoLayer } from '../state/feature-info.actions';
import { LoadingStateEnum } from "@tailormap-viewer/shared";
import { FeatureInfoService } from '../feature-info.service';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';

interface FeatureInfoLayerListItem extends FeatureInfoLayerModel {
  disabled: boolean;
  selected: boolean;
}

@Component({
  selector: 'tm-feature-info-layer-list',
  templateUrl: './feature-info-layer-list.component.html',
  styleUrls: ['./feature-info-layer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureInfoLayerListComponent {

  public layers$: Observable<FeatureInfoLayerListItem[]>;
  public defaultErrorMessage = FeatureInfoService.LOAD_FEATURE_INFO_ERROR;
  public layerSelector = new FormControl<string | null>(null);
  public isSmallScreen$: Observable<boolean>;

  constructor(
    private store$: Store,
    public breakpointObserver: BreakpointObserver,
    private destroyRef: DestroyRef,
  ) {
    this.layers$ = combineLatest([
      this.store$.select(selectFeatureInfoLayers),
      this.store$.select(selectSelectedLayerId),
    ]).pipe(
      map(([ layers, selectedLayerId ]) => layers.map(l => ({
        ...l,
        disabled: this.isDisabled(l),
        selected: l.id === selectedLayerId,
      }))),
      tap(layers => {
        this.layerSelector.patchValue(layers.find(l => l.selected)?.id ?? null);
      }),
    );
    this.layerSelector.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layer => {
        if (layer) {
          this.store$.dispatch(setSelectedFeatureInfoLayer({ layer }));
        }
      });
    this.isSmallScreen$ = this.breakpointObserver.observe('(max-width: 600px)')
      .pipe(map(match => match.matches));
  }

  public selectLayer(layer: FeatureInfoLayerListItem) {
    if (layer.disabled) {
      return;
    }
    this.store$.dispatch(setSelectedFeatureInfoLayer({ layer: layer.id }));
  }

  private isDisabled(layer: FeatureInfoLayerModel) {
    if (layer.loading === LoadingStateEnum.LOADED || layer.loading === LoadingStateEnum.FAILED) {
      return layer.totalCount === 0;
    }
    return false;
  }
}
