import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ComponentModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-mobile-menubar-bottom',
  templateUrl: './mobile-menubar-bottom.component.html',
  styleUrls: ['./mobile-menubar-bottom.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarBottomComponent {

  private _config: ComponentModel[] = [];

  @Input({ required: true })
  public set config(config: ComponentModel[]) {
    this._config = config;
  }
  public get config(): ComponentModel[] {
    return this._config;
  }
}
