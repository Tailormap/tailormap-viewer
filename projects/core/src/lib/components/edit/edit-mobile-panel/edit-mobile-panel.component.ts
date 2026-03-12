import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { MenubarService } from '../../menubar';
import { AuthenticatedUserService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { ComponentRegistrationService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditMenuButtonComponent } from '../edit-menu-button/edit-menu-button.component';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { selectEditDialogVisible } from '../state/edit.selectors';

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

    combineLatest([
      this.visible$,
      this.store$.select(selectEditDialogVisible),
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ visibleInMobileLayout, editDialogVisible ]) => {
        if (visibleInMobileLayout) {
          if (editDialogVisible) {
            this.menubarService.setMobilePanelHeight(450);
          } else {
            this.menubarService.setMobilePanelHeight(130);
          }
        }
      });

  }

  public ngOnDestroy(): void {
    this.componentRegistrationService.deregisterComponent('mobile-menu-bottom', BaseComponentTypeEnum.EDIT);
  }

}
