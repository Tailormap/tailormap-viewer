import { Injectable } from '@angular/core';
import { AdditionalFeatureModel, BaseFeatureRegistrationService } from '../../../services';

interface AdditionalDrawingFeatureModel extends AdditionalFeatureModel {
  position?: 'belowDrawingButtons' | 'aboveDrawingButtons';
}

@Injectable({
  providedIn: 'root',
})
export class DrawingFeatureRegistrationService extends BaseFeatureRegistrationService<AdditionalDrawingFeatureModel> {

}
