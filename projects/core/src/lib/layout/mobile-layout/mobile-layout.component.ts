import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'tm-mobile-layout',
  templateUrl: './mobile-layout.component.html',
  styleUrls: ['./mobile-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileLayoutComponent {
  public layoutService = inject(LayoutService);
  public componentTypes = BaseComponentTypeEnum;
  protected readonly BaseComponentTypeEnum = BaseComponentTypeEnum;
}
