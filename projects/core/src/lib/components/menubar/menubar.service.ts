import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, take } from 'rxjs';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { RegisteredComponent } from '@tailormap-viewer/shared';
import { MobileLayoutService } from '../../services/viewer-layout/mobile-layout.service';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Injectable({
  providedIn: 'root',
})
export class MenubarService {
  private componentRegistrationService = inject(ComponentRegistrationService);
  private mobileLayoutService = inject(MobileLayoutService);


  private activeComponent$ = new BehaviorSubject<{ componentId: string; dialogTitle: string } | null>(null);

  public panelWidth = 300;
  private mobilePanelHeight$ = new BehaviorSubject<number | null>(null);

  public toggleActiveComponent(componentId: string, dialogTitle: string) {
    if (this.activeComponent$.value?.componentId === componentId) {
      this.mobileLayoutService.isMobileLayoutEnabled$.pipe(take(1)).subscribe(isMobileLayoutEnabled => {
        if (isMobileLayoutEnabled && MobileLayoutService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(componentId)) {
          this.activeComponent$.next({
            componentId: BaseComponentTypeEnum.MOBILE_MENUBAR_HOME,
            dialogTitle: $localize `:@@core.home.menu:Menu`,
          });
        } else {
          this.closePanel();
        }
      });
      return;
    }
    this.activeComponent$.next({ componentId, dialogTitle });
  }

  public closePanel() {
    this.activeComponent$.next(null);
  }

  public getActiveComponent$() {
    return this.activeComponent$.asObservable();
  }

  public isComponentVisible$(componentId: string) {
    return this.activeComponent$.asObservable().pipe(map(c => c !== null && c.componentId === componentId));
  }

  public registerComponent(component: RegisteredComponent) {
    this.componentRegistrationService.registerComponent('menu', component);
    if (MobileLayoutService.MOBILE_MENUBAR_COMPONENTS.includes(component.type)) {
      this.componentRegistrationService.registerComponent('mobile-menu-bottom', component);
    }
    if (MobileLayoutService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(component.type)) {
      this.componentRegistrationService.registerComponent('mobile-menu-home', component);
    }
  }

  public deregisterComponent(type: string) {
    this.componentRegistrationService.deregisterComponent('menu', type);
    if (MobileLayoutService.MOBILE_MENUBAR_COMPONENTS.includes(type)) {
      this.componentRegistrationService.deregisterComponent('mobile-menu-bottom', type);
    }
    if (MobileLayoutService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(type)) {
      this.componentRegistrationService.deregisterComponent('mobile-menu-home', type);
    }
  }

  public setMobilePanelHeight(height: number | null) {
    if (height) {
      const newHeight = Math.min(this.getMaxMobilePanelHeightPx(), height)
      this.mobilePanelHeight$.next(newHeight);
    }
  }

  public getMobilePanelHeight$() {
    return this.mobilePanelHeight$.asObservable();
  }

  public setDialogTitle(dialogTitle: string) {
    const current = this.activeComponent$.value;
    if (!current) {
      return;
    }
    this.activeComponent$.next({ ...current, dialogTitle });
  }

  private getMaxMobilePanelHeightPx(): number {
    const viewportHeight = window.innerHeight;
    const mobileMenubarHeightValue: string = window.getComputedStyle(document.documentElement).getPropertyValue('--mobile-menubar-height');
    const mobileMenubarHeight: number = parseInt(mobileMenubarHeightValue, 10) || 0;
    return viewportHeight - mobileMenubarHeight - 60;
  }

}
