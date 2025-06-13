import { MapService } from '@tailormap-viewer/map';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeatureUpdatedService {

  public featureUpdated = new Subject<{ layerId: string; featureId: string }>();
  public featureUpdated$ = this.featureUpdated.asObservable();

  constructor(
    private mapService: MapService,
  ) {
  }

  public updatedFeature(layerId: string, featureId: string) {
    this.mapService.refreshLayer(layerId);
    this.featureUpdated.next({ layerId, featureId });
  }

}
