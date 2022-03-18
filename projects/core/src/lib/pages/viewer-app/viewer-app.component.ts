import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { map, of, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadApplication } from '../../state/core.actions';

@Component({
  selector: 'tm-viewer-app',
  templateUrl: './viewer-app.component.html',
  styleUrls: ['./viewer-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerAppComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
  ) { }

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroyed),
        map((params: ParamMap) => {
          const id = params.get('id');
          if (!!id) {
            return { id: +(id) };
          }
          const name = params.get('name');
          if (!!name) {
            return { name, version: params.get('version') || undefined };
          }
          return null;
        }),
      )
      .subscribe(loadApplicationParams => {
        this.store$.dispatch(loadApplication(loadApplicationParams || {}));
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
