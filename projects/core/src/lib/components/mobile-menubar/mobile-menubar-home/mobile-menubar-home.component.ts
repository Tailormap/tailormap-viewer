import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { MobileMenubarHomeButtonComponent } from '../mobile-menubar-home-button/mobile-menubar-home-button.component';
import { combineLatest, map, Observable } from 'rxjs';
import { MenubarService } from '../../menubar/menubar.service';
import { ComponentRegistrationService } from '../../../services/component-registration.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayoutService } from '../../../layout/layout.service';

@Component({
  selector: 'tm-mobile-menubar-home',
  templateUrl: './mobile-menubar-home.component.html',
  styleUrls: ['./mobile-menubar-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarHomeComponent implements OnInit, OnDestroy {
  private componentRegistrationService = inject(ComponentRegistrationService);
  private menubarService = inject(MenubarService);
  public layoutService = inject(LayoutService);
  private destroyRef = inject(DestroyRef);

  public visible$: Observable<boolean>;

  constructor() {
    this.visible$ = combineLatest([
      this.menubarService.getActiveComponent$(),
      this.componentRegistrationService.getRegisteredComponents$('mobile-menu-home'),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([ activeComponent, registeredComponents ]) => {
        if (!activeComponent) {
          return false;
        }
        return activeComponent.componentId === BaseComponentTypeEnum.MOBILE_MENUBAR_HOME
          || registeredComponents.some(c => c.type === activeComponent.componentId);
      }),
    );

    this.visible$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visible => {
        if (visible) {
          this.menubarService.setMobilePanelHeight(110);
        } else {
          this.menubarService.setMobilePanelHeight(400);
        }
      });
  }

  public ngOnInit(): void {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.MOBILE_MENUBAR_HOME, component: MobileMenubarHomeButtonComponent });
  }

  public ngOnDestroy() {
    this.menubarService.deregisterComponent(BaseComponentTypeEnum.MOBILE_MENUBAR_HOME);
  }

}
