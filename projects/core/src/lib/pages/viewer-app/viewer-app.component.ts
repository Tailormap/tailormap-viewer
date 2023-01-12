import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable, of, Subject, takeUntil } from 'rxjs';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadApplication } from '../../state/core.actions';
import { selectApplicationErrorMessage, selectApplicationLoadingState } from '../../state/core.selectors';
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
    this.route.paramMap
      .pipe(
        takeUntil(this.destroyed),
        map((params: ParamMap) => {
          const id = params.get('id');
          if (id) {
            return { id: +(id) };
          }
          const name = params.get('name');
          if (name) {
            return { name, version: params.get('version') || undefined };
          }
          return null;
        }),
      )
      .subscribe(loadApplicationParams => {
        this.appStyleService.resetStyling();
        this.store$.dispatch(loadApplication(loadApplicationParams || {}));
      });

    this.errorMessage$ = this.store$.select(selectApplicationErrorMessage);
    this.store$.select(selectApplicationLoadingState)
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
