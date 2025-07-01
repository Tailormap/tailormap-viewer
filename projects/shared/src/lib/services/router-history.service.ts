import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { BehaviorSubject, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class RouterHistoryService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);


  private previousUrl = new BehaviorSubject<string | null>(null);
  private currentUrl = new BehaviorSubject<string | null>(null);
  private historySize = 0;

  constructor() {
    const router = this.router;

    router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        startWith(new NavigationEnd(-1, this.router.url, this.router.url)),
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.previousUrl.next(this.currentUrl.value);
          this.currentUrl.next(event.url);
          this.historySize++;
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

  public isFirstNavigation(url: string | null) {
    if (this.historySize >= 3) {
      return false;
    }
    // Since we are redirecting directly the first navigation will have happened before reaching this method,
    // so we check also for size = 2 and equal url. See admin-template.component.ts:32
    return this.historySize <= 1 || (this.historySize === 2 && this.getPreviousUrl() === url);
  }

  public getCurrentUrl() {
    return this.currentUrl.value;
  }

}
