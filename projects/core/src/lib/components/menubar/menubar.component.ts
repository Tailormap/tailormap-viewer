import { Component, Input } from '@angular/core';
import { BaseComponentTypeEnum, ComponentModel, HeaderComponentConfigModel } from '@tailormap-viewer/api';
import { MenubarLogoComponent } from './menubar-logo/menubar-logo.component';
import { RegisteredComponentsRendererComponent } from '../registered-components-renderer/registered-components-renderer.component';
import { ProfileComponent } from './profile/profile.component';

@Component({
    selector: 'tm-menubar',
    templateUrl: './menubar.component.html',
    styleUrls: ['./menubar.component.css'],
    imports: [
        MenubarLogoComponent,
        RegisteredComponentsRendererComponent,
        ProfileComponent,
    ],
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
