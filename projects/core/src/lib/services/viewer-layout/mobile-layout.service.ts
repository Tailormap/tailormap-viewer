import { inject, Injectable } from '@angular/core';
import { ApplicationFeature, ApplicationFeatureSwitchService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { BrowserHelper } from '@tailormap-viewer/shared';
import { map } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class MobileLayoutService {
  private applicationFeatureSwitchService = inject(ApplicationFeatureSwitchService);


  public static readonly MOBILE_MENUBAR_COMPONENTS: string[] = [
    BaseComponentTypeEnum.TOC,
    BaseComponentTypeEnum.LEGEND,
    BaseComponentTypeEnum.MOBILE_MENUBAR_HOME,
  ];

  public isMobileLayoutEnabled$ = this.applicationFeatureSwitchService.isFeatureEnabled$(ApplicationFeature.MOBILE_LAYOUT)
      .pipe(map(enabled => enabled && BrowserHelper.isMobile));

}
