import { Component, Input } from '@angular/core';
import { BaseComponentTypeEnum, ComponentModel, HeaderComponentConfigModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'],
  standalone: false,
})
export class MenubarComponent {

  private _config: ComponentModel[] = [];
  public showMenubarLogo = true;

  @Input({ required: true })
  public set config(config: ComponentModel[]) {
    this._config = config;
    this.checkHeaderLogo();
  }
  public get config(): ComponentModel[] {
    return this._config;
  }

  public checkHeaderLogo() {
    const headerConfig = this.config.find(c => c.type === BaseComponentTypeEnum.HEADER);
    this.showMenubarLogo = !headerConfig?.config?.enabled || !((headerConfig.config as HeaderComponentConfigModel).logoFileId);
  }
}
