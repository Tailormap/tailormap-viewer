import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'tm-embedded-layout',
  templateUrl: './embedded-layout.component.html',
  styleUrls: [ '../base-layout/base-layout.component.css', './embedded-layout.component.css' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddedLayoutComponent {
  public componentTypes = BaseComponentTypeEnum;
  constructor(public layoutService: LayoutService) {}
}
