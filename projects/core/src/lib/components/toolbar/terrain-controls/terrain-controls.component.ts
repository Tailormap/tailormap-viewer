import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { LayoutService } from '@tailormap-viewer/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-terrain-controls',
  templateUrl: './terrain-controls.component.html',
  styleUrls: ['./terrain-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TerrainControlsComponent implements OnInit {
  public layoutService = inject(LayoutService);

  public componentTypes = BaseComponentTypeEnum;

  constructor() { }

  public ngOnInit(): void {
  }

}
