import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { RegisteredComponent } from '@tailormap-viewer/shared';
import { MobileLayoutService } from '../../services/viewer-layout/mobile-layout.service';

@Injectable({
  providedIn: 'root',
})
export class MenubarService {
  private componentRegistrationService = inject(ComponentRegistrationService);


  private activeComponent$ = new BehaviorSubject<{ componentId: string; dialogTitle: string } | null>(null);

  public panelWidth = 300;
  private mobilePanelHeight$ = new BehaviorSubject<number | null>(null);

  public toggleActiveComponent(componentId: string, dialogTitle: string) {
    if (this.activeComponent$.value?.componentId === componentId) {
      this.closePanel();
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
  }

  public deregisterComponent(type: string) {
    this.componentRegistrationService.deregisterComponent('menu', type);
    if (MobileLayoutService.MOBILE_MENUBAR_COMPONENTS.includes(type)) {
      this.componentRegistrationService.deregisterComponent('mobile-menu-bottom', type);
    }
  }

  public setMobilePanelHeight(height: number | null) {
    this.mobilePanelHeight$.next(height);
  }

  public getMobilePanelHeight$() {
    return this.mobilePanelHeight$.asObservable();
  }

}
