import { inject, Injectable } from '@angular/core';
import { ApplicationFeature, ApplicationFeatureSwitchService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { BrowserHelper } from '@tailormap-viewer/shared';
import { map, of, switchMap } from 'rxjs';
import { ApplicationBookmarkService } from '../application-bookmark/application-bookmark.service';


@Injectable({
  providedIn: 'root',
})
export class MobileLayoutService {
  private applicationFeatureSwitchService = inject(ApplicationFeatureSwitchService);
  private applicationBookmarkService = inject(ApplicationBookmarkService);


  public static readonly MOBILE_MENUBAR_COMPONENTS: string[] = [
    BaseComponentTypeEnum.TOC,
    BaseComponentTypeEnum.LEGEND,
    BaseComponentTypeEnum.MOBILE_MENUBAR_HOME,
    BaseComponentTypeEnum.EDIT,
  ];

  public static readonly MOBILE_MENUBAR_HOME_COMPONENTS: string[] = [
    BaseComponentTypeEnum.INFO,
    BaseComponentTypeEnum.FILTER,
    BaseComponentTypeEnum.TERRAIN_CONTROLS,
    BaseComponentTypeEnum.PROFILE,
    BaseComponentTypeEnum.COORDINATE_LINK_WINDOW,
  ];

  public isMobileLayoutEnabledAuto$ = this.applicationFeatureSwitchService.isFeatureEnabled$(ApplicationFeature.MOBILE_LAYOUT)
    .pipe(map(enabled => enabled && BrowserHelper.isMobile));

  public isMobileLayoutEnabled$ = this.applicationBookmarkService.getMobileLayoutOption$()
    .pipe(
      switchMap(enabled => {
        if (enabled === "enabled") {
          return of(true);
        } else if (enabled === "disabled") {
          return of(false);
        } else {
          return this.isMobileLayoutEnabledAuto$;
        }
      }),
    );

}
