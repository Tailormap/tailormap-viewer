import { Injectable, inject, DestroyRef } from '@angular/core';
import { DrawingFeatureModel } from '../../../map/models/drawing-feature.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { setSelectedFeature } from '../state/drawing.actions';
import { selectDrawingFeatures } from '../state/drawing.selectors';
import { MapService } from '@tailormap-viewer/map';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DrawingAccessibleFeaturesService {
  private store$ = inject(Store);
  private mapService = inject(MapService);
  private destroyRef = inject(DestroyRef);

  private proxyContainer: HTMLElement | null = null;
  private proxyElements = new Map<string, HTMLElement>();

  public initAccessibilityContainer() {


    // Create hidden proxy container
    this.proxyContainer = document.createElement('div');
    this.proxyContainer.id = 'drawing-feature-proxies';
    this.proxyContainer.style.position = 'absolute';
    this.proxyContainer.style.left = '-9999px';
    this.proxyContainer.style.width = '1px';
    this.proxyContainer.style.height = '1px';
    this.proxyContainer.style.overflow = 'hidden';

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
    console.debug(`Updating proxies for ${features.length} features`);
    // Remove proxies for deleted features
    for (const [fid, element] of this.proxyElements) {
      if (!features.find(f => f.__fid === fid)) {
        element.remove();
        this.proxyElements.delete(fid);
      }
    }

    // Create or update proxies for features
    features.forEach((feature, index) => {
      if (!this.proxyElements.has(feature.__fid)) {
        const proxy = this.createProxyElement(feature, index);
        this.proxyContainer?.appendChild(proxy);
        this.proxyElements.set(feature.__fid, proxy);
      }
    });
  }

  private createProxyElement(feature: DrawingFeatureModel, index: number): HTMLElement {
    console.debug(`Creating proxy for feature: ${feature.__fid}`);
    const proxy = document.createElement('button');
    proxy.type = 'button';
    proxy.setAttribute('data-feature-fid', feature.__fid);
    proxy.className = 'drawing-feature-proxy';

    // Accessible label based on feature type and description
    const label = feature.attributes?.style.description || `${feature.attributes?.type} ${index + 1}`;
    proxy.textContent = label;
    proxy.setAttribute('aria-label', `Select ${label} on map`);

    // Handle focus - select the feature on the map
    proxy.addEventListener('focus', () => {
      if (proxy.matches(':focus-visible')) {
        this.store$.dispatch(setSelectedFeature({ fid: feature.__fid }));
      }
    });

    return proxy;
  }

  public destroy() {
    this.proxyContainer?.remove();
    this.proxyElements.clear();
  }
}
