import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthenticatedUserService } from '../../../api/src/lib/services/authenticated-user.service';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthGuard implements CanActivate {
  constructor(private authService: AuthenticatedUserService, private router: Router) {
  }

  public canActivate(): Observable<boolean | UrlTree> {
    return this.authService.getUserDetails$().pipe(
      map(user =>
        user
          ? true
          : this.router.createUrlTree(['/login'], {
            queryParams: { routeBeforeLogin: this.router.url },
          }),
      ),
    );
  }
}
