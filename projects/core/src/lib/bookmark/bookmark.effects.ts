import { Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, distinctUntilChanged, debounceTime } from 'rxjs';
import { Router } from '@angular/router';
import { getSelectors } from '@ngrx/router-store';
import { loadFragment } from './bookmark.actions';

@Injectable()
export class BookmarkEffects {
  public setBookmarkDataFromFragment$ = createEffect(() =>
    this.store$.select(getSelectors().selectFragment)
      .pipe(
        distinctUntilChanged(),
        debounceTime(0),
        map(uriNow => {
          return loadFragment({ fragment: uriNow });
        }),
      ),
  );

  constructor(
    private router: Router,
    private store$: Store,
  ) { }
}
