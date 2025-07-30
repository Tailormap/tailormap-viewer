import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponentTypeEnum, InfoComponentConfigModel } from "@tailormap-viewer/api";
import { InfoMenuButtonComponent } from "../info-menu-button/info-menu-button.component";
import { ComponentConfigHelper } from "../../../shared/helpers/component-config.helper";
import { Store } from "@ngrx/store";
import { MenubarService } from '../../menubar';

@Component({
  selector: 'tm-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InfoComponent implements OnInit {

  constructor(
    private store$: Store,
      private menubarService: MenubarService,
  ) {
    ComponentConfigHelper.useInitialConfigForComponent<InfoComponentConfigModel>(
      store$,
      BaseComponentTypeEnum.INFO,
      config => {
        if (config.openOnStartup) {
          this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.INFO, 'Info');
        }
      },
    );
  }

  public ngOnInit(): void {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.INFO, component: InfoMenuButtonComponent });
  }

}
