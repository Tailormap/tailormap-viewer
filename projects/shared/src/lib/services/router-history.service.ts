import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { DestroyRef, Injectable } from '@angular/core';
import { BehaviorSubject, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class RouterHistoryService {

  private previousUrl = new BehaviorSubject<string | null>(null);
  private currentUrl = new BehaviorSubject<string | null>(null);

  constructor(
    private router: Router,
    private destroyRef: DestroyRef,
  ) {
    router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        startWith(new NavigationEnd(-1, this.router.url, this.router.url)),
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.previousUrl.next(this.currentUrl.value);
          this.currentUrl.next(event.url);
        }
      });
  }

  public getPreviousUrl$() {
    return this.previousUrl.asObservable();
  }

  public getCurrentUrl$() {
    return this.currentUrl.asObservable();
  }

  public getPreviousUrl() {
    return this.previousUrl.value;
  }

  public getCurrentUrl() {
    return this.currentUrl.value;
  }

}
