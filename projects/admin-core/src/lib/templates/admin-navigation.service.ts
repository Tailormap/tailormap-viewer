import { Injectable, signal, Type } from '@angular/core';
import { NavigationButtonPropsModel } from './models/navigation-button-props.model';
import { AdminRouterService } from '../shared/services/admin-router.service';

export interface NavigationButtonWithPositionModel extends NavigationButtonPropsModel {
  position: 'top' | 'bottom';
  index?: number;
}

export interface RegisteredAdminNavigationRouteModel {
  buttonConfig: Omit<NavigationButtonWithPositionModel, 'link'>;
  component: Type<any>;
  title: string;
  routePath: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminNavigationService extends AdminRouterService {

  private _registeredButtons = signal<NavigationButtonWithPositionModel[]>([]);

  public registeredButtons = this._registeredButtons.asReadonly();

  public registerButton(route: RegisteredAdminNavigationRouteModel) {
    const button: NavigationButtonWithPositionModel = {
      ...route.buttonConfig,
      link: [ '/admin', route.routePath ],
    };
    this._registeredButtons.set([ ...this._registeredButtons(), button ]);
    this.registerRoute(route.title, {
      path: route.routePath,
      data: { pageTitle: route.title },
      component: route.component,
    });
  }

}
