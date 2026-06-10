import { Injectable } from '@angular/core';
import { BaseFeatureRegistrationService } from '../../../services';
import { RegisteredComponent } from '@tailormap-viewer/shared';

interface AdditionalTocFeatureModel extends RegisteredComponent {
  position: 'menuBar' | 'aboveTree' | 'belowTree' | 'layerDetails';
}

@Injectable({
  providedIn: 'root',
})
export class TocFeatureRegistrationService extends BaseFeatureRegistrationService<AdditionalTocFeatureModel> {
}
