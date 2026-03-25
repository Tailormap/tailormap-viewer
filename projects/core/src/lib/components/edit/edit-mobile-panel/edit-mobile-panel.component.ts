import {
  Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef, ElementRef, AfterViewInit, viewChild, effect,
} from '@angular/core';
import { MenubarService } from '../../menubar';
import { AuthenticatedUserService, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { ComponentRegistrationService } from '../../../services';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditMenuButtonComponent } from '../edit-menu-button/edit-menu-button.component';
import { Store } from '@ngrx/store';
import { selectEditOpenedFromFeatureInfo } from '../state/edit.selectors';

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

  private editWrapper = viewChild<ElementRef<HTMLElement>>('editWrapper');

  private resizeObserver: ResizeObserver | null = null;
  private static readonly MAX_HEIGHT = 450;
  private static readonly HEIGHT_OFFSET = 70;

  public visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.EDIT);
  public openedFromFeatureInfo = this.store$.selectSignal(selectEditOpenedFromFeatureInfo);

  constructor() {
    effect(() => {
      const el = this.editWrapper()?.nativeElement;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      if (el) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updatePanelHeight(el);
        });
        this.resizeObserver.observe(el);
      }
    });
  }

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

    // combineLatest([
    //   this.visible$,
    //   this.store$.select(selectEditDialogVisible),
    // ]).pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(([ visibleInMobileLayout, editDialogVisible ]) => {
    //     if (visibleInMobileLayout) {
    //       if (editDialogVisible) {
    //         this.menubarService.setMobilePanelHeight(450);
    //       } else {
    //         this.menubarService.setMobilePanelHeight(130);
    //       }
    //     }
    //   });

  }

  private updatePanelHeight(el: HTMLElement): void {
    const contentHeight = el.scrollHeight;
    const newHeight = Math.min(contentHeight + EditMobilePanelComponent.HEIGHT_OFFSET, EditMobilePanelComponent.MAX_HEIGHT);
    this.menubarService.setMobilePanelHeight(newHeight);
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.componentRegistrationService.deregisterComponent('mobile-menu-bottom', BaseComponentTypeEnum.EDIT);
  }

}
