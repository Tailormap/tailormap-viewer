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

  private openOnStartup = false;

  constructor(
    private store$: Store,
      private menubarService: MenubarService,
  ) {
    ComponentConfigHelper.useInitialConfigForComponent<InfoComponentConfigModel>(
      store$,
      BaseComponentTypeEnum.INFO,
      config => {
        this.openOnStartup = config.openOnStartup ?? false;
      },
    );
  }

  public ngOnInit(): void {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.INFO, component: InfoMenuButtonComponent });
    if (this.openOnStartup) {
      this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.INFO, $localize `:@@core.info.info:Info`);
    }
  }

}
