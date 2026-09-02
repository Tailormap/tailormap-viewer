import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ProjectionAvailability } from '../../application/helpers/admin-projections-helper';
import { MatList, MatListItem, MatListItemMeta } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-projection-availability',
    templateUrl: './projection-availability.component.html',
    styleUrls: ['./projection-availability.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatList,
        MatListItem,
        MatIcon,
        MatListItemMeta,
    ],
})
export class ProjectionAvailabilityComponent {

  @Input()
  public projectionAvailability: ProjectionAvailability[] = [];

}
