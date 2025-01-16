import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'tm-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BaseLayoutComponent {
  public componentTypes = BaseComponentTypeEnum;
  constructor(public layoutService: LayoutService) {}
}
