import { Injectable, inject, DestroyRef } from '@angular/core';
import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { setSelectedFeature } from '../state/drawing.actions';
import { selectDrawingFeatures } from '../state/drawing.selectors';
import { MapService } from '@tailormap-viewer/map';
import { take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent, SnackBarMessageOptionsModel } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class DrawingAccessibleFeaturesService {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  private proxyContainer: HTMLElement | null = null;
  private proxyElements = new Map<string, HTMLElement>();

  public initAccessibleFeaturesContainer() {
    if (this.proxyContainer) {
      return;
    }
    this.proxyContainer = document.createElement('div');
    this.proxyContainer.id = 'drawing-feature-proxies';

    this.mapService.getMapTargetElement$().pipe(take(1)).subscribe(container => {
      if (container && this.proxyContainer) {
        container.appendChild(this.proxyContainer);
      }
    });

    // Listen to drawing features and create/update proxies
    this.store$.select(selectDrawingFeatures)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(features => {
        this.updateProxies(features);
      });
  }

  private updateProxies(features: DrawingFeatureModel[]) {
    // Remove proxies for deleted features
    for (const [ fid, element ] of this.proxyElements) {
      if (!features.find(f => f.__fid === fid)) {
        element.remove();
        this.proxyElements.delete(fid);
      }
    }

    // Create or update proxies for features
    features.forEach(feature => {
      if (!this.proxyElements.has(feature.__fid)) {
        const proxyElement = this.createProxyElement(feature);
        this.proxyContainer?.appendChild(proxyElement);
        this.proxyElements.set(feature.__fid, proxyElement);
      }
    });
  }

  private createProxyElement(feature: DrawingFeatureModel): HTMLElement {
    const proxyElement = document.createElement('div');
    proxyElement.tabIndex = 0;
    proxyElement.setAttribute('data-feature-fid', feature.__fid);
    proxyElement.className = 'drawing-feature-proxy';

    const featureLabel = feature.attributes?.style.description || feature.attributes?.type;
    const message = $localize `:@@core.drawing.edit-feature-keyboard:Edit ${featureLabel},
      use arrow keys to move the feature, use '+' and '-' keys to resize, and use 'r' and 'shift+r' to rotate.`;
    proxyElement.setAttribute('aria-label', message);

    proxyElement.addEventListener('focus', () => {
      if (proxyElement.matches(':focus-visible')) {
        this.store$.dispatch(setSelectedFeature({ fid: feature.__fid }));
        this.showSnackbarMessage(message);
      }
    });

    proxyElement.addEventListener('blur', () => {
      this.store$.dispatch(setSelectedFeature({ fid: null }));
    });

    return proxyElement;
  }

  public destroyAccessibleFeaturesContainer() {
    this.proxyContainer?.remove();
    this.proxyContainer = null;
    this.proxyElements.clear();
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
}
