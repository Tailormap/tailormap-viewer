import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable, startWith } from 'rxjs';

export class ClassNameHelper {

  public static getClassNameForRoute$(
    route: Router,
    activatedRoute: ActivatedRoute,
  ): Observable<string> {
    return route.events
      .pipe(
        startWith(new NavigationEnd(-1, route.url, route.url)),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => {
          if (activatedRoute.snapshot.data['className']) {
            return activatedRoute.snapshot.data['className'];
          }
          if (activatedRoute.snapshot.children.length > 0) {
            return activatedRoute.snapshot.children[0].data['className'];
          }
          return '';
        }),
      );
  }

}
