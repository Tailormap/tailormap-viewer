import { MapService } from '@tailormap-viewer/map';
import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeatureUpdatedService {
  private mapService = inject(MapService);


  public featureUpdated = new Subject<{ layerId: string; featureId?: string }>();
  public featureUpdated$ = this.featureUpdated.asObservable();

  public updatedFeature(layerId: string, featureId?: string) {
    this.mapService.refreshLayer(layerId);
    this.featureUpdated.next({ layerId, featureId });
  }

}
