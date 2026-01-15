import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { MobileMenubarHomeButtonComponent } from '../mobile-menubar-home-button/mobile-menubar-home-button.component';
import { MenubarService } from '../../menubar/menubar.service';

@Component({
  selector: 'tm-mobile-menubar-home',
  templateUrl: './mobile-menubar-home.component.html',
  styleUrls: ['./mobile-menubar-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarHomeComponent implements OnInit, OnDestroy {
  private menubarService = inject(MenubarService);


  public ngOnInit(): void {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.MOBILE_MENUBAR_HOME, component: MobileMenubarHomeButtonComponent });
  }

  public ngOnDestroy() {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.MOBILE_MENUBAR_HOME);
  }

}
