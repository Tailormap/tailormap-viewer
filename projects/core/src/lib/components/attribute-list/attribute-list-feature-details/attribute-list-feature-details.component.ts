import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FeatureDetailModel, FeatureDetailsModel } from '../models/attribute-list-api-service.model';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';

@Component({
    selector: 'tm-attribute-list-feature-details',
    templateUrl: './attribute-list-feature-details.component.html',
    styleUrls: ['./attribute-list-feature-details.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
    ],
})
export class AttributeListFeatureDetailsComponent {
  public featureDetails = input<FeatureDetailsModel | null>(null);
  public getColumnKeys(detail: FeatureDetailModel) {
    return detail.columns.map(c => c.key);
  }
}
