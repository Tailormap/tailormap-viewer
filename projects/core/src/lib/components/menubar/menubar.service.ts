import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { BrowserHelper, RegisteredComponent } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Injectable({
  providedIn: 'root',
})
export class MenubarService {
  private componentRegistrationService = inject(ComponentRegistrationService);


  private static readonly MOBILE_MENUBAR_COMPONENTS: string[] = [
    BaseComponentTypeEnum.TOC,
    BaseComponentTypeEnum.LEGEND,
    BaseComponentTypeEnum.MOBILE_MENUBAR_HOME,
    BaseComponentTypeEnum.EDIT,
  ];

  public static readonly MOBILE_MENUBAR_HOME_COMPONENTS: string[] = [
    BaseComponentTypeEnum.INFO,
    BaseComponentTypeEnum.FILTER,
  ];

  private activeComponent$ = new BehaviorSubject<{ componentId: string; dialogTitle: string } | null>(null);

  public panelWidth = 300;
  private mobilePanelHeight$ = new BehaviorSubject<number | null>(null);

  public toggleActiveComponent(componentId: string, dialogTitle: string) {
    if (this.activeComponent$.value?.componentId === componentId) {
      if (BrowserHelper.isMobile && MenubarService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(componentId)) {
        this.activeComponent$.next({
          componentId: BaseComponentTypeEnum.MOBILE_MENUBAR_HOME,
          dialogTitle: $localize `:@@core.home.menu:Menu`,
        });
      } else {
        this.closePanel();
      }
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

  public registerComponent(component: RegisteredComponent, standardMenubarComponent = true) {
    if (!BrowserHelper.isMobile && standardMenubarComponent) {
      this.componentRegistrationService.registerComponent('menu', component);
    } else if (BrowserHelper.isMobile && MenubarService.MOBILE_MENUBAR_COMPONENTS.includes(component.type)) {
      this.componentRegistrationService.registerComponent('mobile-menu-bottom', component);
    } else if (BrowserHelper.isMobile && MenubarService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(component.type)) {
      this.componentRegistrationService.registerComponent('mobile-menu-home', component);
    }
  }

  public deregisterComponent(type: string, standardMenubarComponent = true) {
    if (!BrowserHelper.isMobile && standardMenubarComponent) {
      this.componentRegistrationService.deregisterComponent('menu', type);
    } else if (BrowserHelper.isMobile && MenubarService.MOBILE_MENUBAR_COMPONENTS.includes(type)) {
      this.componentRegistrationService.deregisterComponent('mobile-menu-bottom', type);
    } else if (BrowserHelper.isMobile && MenubarService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(type)) {
      this.componentRegistrationService.deregisterComponent('mobile-menu-home', type);
    }
  }

  public setMobilePanelHeight(height: number | null) {
    this.mobilePanelHeight$.next(height);
  }

  public getMobilePanelHeight$() {
    return this.mobilePanelHeight$.asObservable();
  }

}
