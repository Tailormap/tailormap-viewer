import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FeatureDetailModel, FeatureDetailsModel } from '../models/attribute-list-api-service.model';

@Component({
  selector: 'tm-attribute-list-feature-details',
  templateUrl: './attribute-list-feature-details.component.html',
  styleUrls: ['./attribute-list-feature-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AttributeListFeatureDetailsComponent {
  public featureDetails = input<FeatureDetailsModel | null>(null);
  public getColumnKeys(detail: FeatureDetailModel) {
    return detail.columns.map(c => c.key);
  }

  protected isSelectedDetailRow(idx: number, row: FeatureDetailModel) {
    console.log(idx, row);
    return true;
  }

}
