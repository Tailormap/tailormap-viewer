import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../../../layout/layout.service';

@Component({
  selector: 'tm-terrain-controls',
  templateUrl: './terrain-controls.component.html',
  styleUrls: ['./terrain-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainControlsComponent {
  public layoutService = inject(LayoutService);

  public componentTypes = BaseComponentTypeEnum;
}
