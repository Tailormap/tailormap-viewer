import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable, of, Subject, takeUntil } from 'rxjs';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadViewer } from '../../state/core.actions';
import { selectViewerErrorMessage, selectViewerLoadingState } from '../../state/core.selectors';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { ApplicationStyleService } from '../../services/application-style.service';

@Component({
  selector: 'tm-viewer-app',
  templateUrl: './viewer-app.component.html',
  styleUrls: ['./viewer-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerAppComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public isLoading = false;
  public loadingFailed = false;
  public isLoaded = false;
  public errorMessage$: Observable<string | undefined> = of(undefined);

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private bookmarkService: BookmarkService,
    private appStyleService: ApplicationStyleService,
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
      )
      .subscribe(loadViewerParams => {
        this.appStyleService.resetStyling();
        this.store$.dispatch(loadViewer(loadViewerParams || {}));
      });

    this.errorMessage$ = this.store$.select(selectViewerErrorMessage);
    this.store$.select(selectViewerLoadingState)
      .pipe(takeUntil(this.destroyed))
      .subscribe(loadingState => {
        this.isLoaded = loadingState === LoadingStateEnum.LOADED;
        this.isLoading = loadingState === LoadingStateEnum.LOADING;
        this.loadingFailed = loadingState === LoadingStateEnum.FAILED;
        this.cdr.detectChanges();
      });

    this.route.fragment
      .pipe(takeUntil(this.destroyed))
      .subscribe(fragment => {
          this.bookmarkService.setBookmark(fragment === null ? undefined : fragment);
      });

    this.bookmarkService.getBookmarkValue$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(bookmark => {
          this.router.navigate([], { relativeTo: this.route, fragment: bookmark, replaceUrl: true });
      });
  }

  public ngOnDestroy() {
    this.appStyleService.resetStyling();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
