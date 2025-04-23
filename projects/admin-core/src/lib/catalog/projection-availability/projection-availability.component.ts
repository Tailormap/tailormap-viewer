import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ProjectionAvailability } from '../../application/helpers/admin-projections-helper';

@Component({
  selector: 'tm-admin-projection-availability',
  templateUrl: './projection-availability.component.html',
  styleUrls: ['./projection-availability.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProjectionAvailabilityComponent {

  @Input()
  public projectionAvailability: ProjectionAvailability[] = [];

}
