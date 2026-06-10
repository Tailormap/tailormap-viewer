import { inject, Injectable } from '@angular/core';
import { ApplicationFeature, ApplicationFeatureSwitchService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { BrowserHelper } from '@tailormap-viewer/shared';
import { BehaviorSubject, map, of, switchMap } from 'rxjs';

export enum MobileLayoutBookmarkEnum {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  AUTO = 'auto',
}

@Injectable({
  providedIn: 'root',
})
export class MobileLayoutService {
  private applicationFeatureSwitchService = inject(ApplicationFeatureSwitchService);


  private mobileLayoutBookmarkValue = new BehaviorSubject<MobileLayoutBookmarkEnum | null>(null);

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
    BaseComponentTypeEnum.COORDINATE_PICKER,
  ];

  public isMobileLayoutEnabledAuto$ = this.applicationFeatureSwitchService.isFeatureEnabled$(ApplicationFeature.MOBILE_LAYOUT)
    .pipe(map(enabled => enabled && BrowserHelper.isMobile));

  public isMobileLayoutEnabled$ = this.mobileLayoutBookmarkValue.asObservable()
    .pipe(
      switchMap(enabled => {
        if (enabled === MobileLayoutBookmarkEnum.ENABLED) {
          return of(true);
        } else if (enabled === MobileLayoutBookmarkEnum.DISABLED) {
          return of(false);
        } else {
          return this.isMobileLayoutEnabledAuto$;
        }
      }),
    );

  public setMobileLayoutBookmark(value: MobileLayoutBookmarkEnum) {
    this.mobileLayoutBookmarkValue.next(value);
  }

}
