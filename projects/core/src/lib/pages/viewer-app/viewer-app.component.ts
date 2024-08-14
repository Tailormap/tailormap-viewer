import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { distinctUntilChanged, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadViewer } from '../../state/core.actions';
import { selectViewerErrorMessage, selectViewerLoadingState, selectViewerTitle } from '../../state/core.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ApplicationStyleService } from '../../services/application-style.service';
import { DOCUMENT } from '@angular/common';
import { ApplicationBookmarkService } from '../../services/application-bookmark/application-bookmark.service';

@Component({
  selector: 'tm-viewer-app',
  templateUrl: './viewer-app.component.html',
  styleUrls: ['./viewer-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerAppComponent implements OnInit, OnDestroy {

  private static DEFAULT_TITLE = 'Tailormap';
  private destroyed = new Subject();
  public isLoading = signal(false);
  public loadingFailed = signal(false);
  public isLoaded = signal(false);
  public errorMessage$: Observable<string | undefined> = of(undefined);
  public isEmbedded$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
    // private cdr: ChangeDetectorRef,
    private applicationBookmarkService: ApplicationBookmarkService,
    private appStyleService: ApplicationStyleService,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  public ngOnInit(): void {
    this.route.url
      .pipe(
        takeUntil(this.destroyed),
        map((urls: UrlSegment[]) => {
          if (urls.length === 2) {
            const kind = urls[0].path;
            const name = urls[1].path;
            if ([ 'app', 'service' ].includes(kind)) {
              return { id: `${kind}/${name}` };
            }
          }
          return undefined;
        }),
        distinctUntilChanged((v1, v2) => v1 === v2 || v1?.id === v2?.id),
      )
      .subscribe(loadViewerParams => {
        this.appStyleService.resetStyling();
        this.store$.dispatch(loadViewer(loadViewerParams || {}));
      });

    this.errorMessage$ = this.store$.select(selectViewerErrorMessage);
    this.store$.select(selectViewerLoadingState)
      .pipe(takeUntil(this.destroyed))
      .subscribe(loadingState => {
        this.isLoaded.set(loadingState === LoadingStateEnum.LOADED);
        this.isLoading.set(loadingState === LoadingStateEnum.LOADING);
        this.loadingFailed.set(loadingState === LoadingStateEnum.FAILED);
        this.isEmbedded$ = this.applicationBookmarkService.isEmbeddedApplication$();
        // this.cdr.detectChanges();
      });

    this.store$.select(selectViewerTitle)
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (title) => {
          this.document.title = title || ViewerAppComponent.DEFAULT_TITLE;
        },
        complete: () => {
          this.document.title = ViewerAppComponent.DEFAULT_TITLE;
        },
      });
  }

  public ngOnDestroy() {
    this.appStyleService.resetStyling();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
