import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable, startWith } from 'rxjs';

export class RoutePropertyHelper {

  public static getPropForRoute$(
    route: Router,
    activatedRoute: ActivatedRoute,
    prop: string,
  ): Observable<string> {
    return route.events
      .pipe(
        startWith(new NavigationEnd(-1, route.url, route.url)),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => {
          if (activatedRoute.snapshot.data[prop]) {
            return activatedRoute.snapshot.data[prop];
          }
          if (activatedRoute.snapshot.children.length > 0) {
            return activatedRoute.snapshot.children[0].data[prop];
          }
          return '';
        }),
      );
  }

}
