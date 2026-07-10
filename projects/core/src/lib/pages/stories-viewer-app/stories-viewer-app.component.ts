import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, Input, OnDestroy, OnInit, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule, LoadingStateEnum } from '@tailormap-viewer/shared';
import { selectViewerErrorMessage, selectViewerLoadingState } from '../../state/core.selectors';
import { MobileLayoutService } from '../../services/viewer-layout/mobile-layout.service';
import { LayoutModule } from '../../layout/layout.module';
import { LoadViewerService } from '../../services/load-viewer.service';

/**
 * Entry-point component to run a viewer in isolation, e.g. multiple viewers on a single page (stories).
 *
 * Unlike {@link ViewerAppComponent} this component does not touch any global (browser) state: it has no
 * routing/URL-bookmark integration (no `ActivatedRoute`, `Router` or `ApplicationBookmarkService`), it does
 * not set `document.title` and it does not mutate global CSS variables through `ApplicationStyleService`.
 *
 * It is intended to be created inside its own `EnvironmentInjector` (with its own store/effects) so that
 * several instances can coexist on one page, each with its own context. Because of that it is a standalone
 * component that can be instantiated directly via `createComponent(StoriesViewerAppComponent, ...)`.
 *
 * The viewer to load is provided through the {@link viewerId} input (e.g. `app/default` or `service/xyz`)
 * instead of being derived from the route.
 */
@Component({
  selector: 'tm-stories-viewer-app',
  templateUrl: './stories-viewer-app.component.html',
  styleUrls: ['./stories-viewer-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedModule,
    LayoutModule,
  ],
})
export class StoriesViewerAppComponent implements OnInit, OnDestroy {

  private store$ = inject(Store);
  private mobileLayoutService = inject(MobileLayoutService);
  private loadViewerService = inject(LoadViewerService);

  public viewerId = input('');

  private destroyed = new Subject();
  public isLoading = signal(false);
  public loadingFailed = signal(false);
  public isLoaded = signal(false);
  public errorMessage$ = this.store$.select(selectViewerErrorMessage);
  public isMobileLayoutEnabled$ = this.mobileLayoutService.isMobileLayoutEnabled$;

  constructor() {
    effect(() => {
      const viewerId = this.viewerId();
      if (viewerId) {
        this.loadViewerService.loadViewer(viewerId);
      }
    });
  }

  public ngOnInit(): void {
    this.store$.select(selectViewerLoadingState)
      .pipe(takeUntil(this.destroyed))
      .subscribe(loadingState => {
        this.isLoaded.set(loadingState === LoadingStateEnum.LOADED);
        this.isLoading.set(loadingState === LoadingStateEnum.LOADING);
        this.loadingFailed.set(loadingState === LoadingStateEnum.FAILED);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
