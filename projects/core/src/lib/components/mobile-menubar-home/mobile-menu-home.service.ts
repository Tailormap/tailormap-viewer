import { inject, Injectable } from '@angular/core';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { RegisteredComponent } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class MobileMenuHomeService {
  private componentRegistrationService = inject(ComponentRegistrationService);

  public registerComponent(component: RegisteredComponent) {
    this.componentRegistrationService.registerComponent('mobile-menu-home', component);
  }

  public deregisterComponent(type: string) {
    this.componentRegistrationService.deregisterComponent('mobile-menu-home', type);
  }
}
