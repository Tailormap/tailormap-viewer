import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { MenubarService } from '../../menubar';
import { filter, switchMap } from 'rxjs';
import { AuthenticatedUserService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { ComponentRegistrationService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditMenuButtonComponent } from '../edit-menu-button/edit-menu-button.component';
import { MobileLayoutService } from '../../../services/viewer-layout/mobile-layout.service';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-edit-mobile-panel',
  templateUrl: './edit-mobile-panel.component.html',
  styleUrls: ['./edit-mobile-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditMobilePanelComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private menubarService = inject(MenubarService);
  private authenticatedUserService = inject(AuthenticatedUserService);
  private componentRegistrationService = inject(ComponentRegistrationService);
  private destroyRef = inject(DestroyRef);
  private mobileLayoutService = inject(MobileLayoutService);
  private mapService = inject(MapService);


  public visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.EDIT);

  public ngOnInit(): void {
    this.authenticatedUserService.getUserDetails$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((userDetails) => {
        if (userDetails.isAuthenticated) {
          this.componentRegistrationService.registerComponent(
            'mobile-menu-bottom',
            { type: BaseComponentTypeEnum.EDIT, component: EditMenuButtonComponent },
          );
        }
      });

    // Toggle the Edit map tool when the Edit menu button is clicked in the mobile layout.
    this.mobileLayoutService.isMobileLayoutEnabled$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(enabled => enabled),
        switchMap(() => this.menubarService.isComponentVisible$(BaseComponentTypeEnum.EDIT)),
      ).subscribe(visibleInMobileLayout => {
      if (visibleInMobileLayout) {
        this.menubarService.setMobilePanelHeight(450);
      }
    });

  }

  public ngOnDestroy(): void {
    this.componentRegistrationService.deregisterComponent('mobile-menu-bottom', BaseComponentTypeEnum.EDIT);
  }

}
