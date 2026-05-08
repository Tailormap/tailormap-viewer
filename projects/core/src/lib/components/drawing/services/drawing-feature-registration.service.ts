import { Injectable } from '@angular/core';
import { BaseFeatureRegistrationService } from '../../../services';
import { RegisteredComponent } from '@tailormap-viewer/shared';

interface AdditionalDrawingFeatureModel extends RegisteredComponent {
  position?: 'belowDrawingButtons' | 'aboveDrawingButtons';
}

@Injectable({
  providedIn: 'root',
})
export class DrawingFeatureRegistrationService extends BaseFeatureRegistrationService<AdditionalDrawingFeatureModel> {

}
