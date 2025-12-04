import { ActivatedRouteSnapshot, CanActivate, RedirectCommand, Router, RouterStateSnapshot } from '@angular/router';
import { AuthenticatedUserService } from '@tailormap-viewer/api';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthGuard implements CanActivate {
  private authService = inject(AuthenticatedUserService);
  private router = inject(Router);
  public canActivate(_next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | RedirectCommand> {
    return this.authService.isAdminUser$().pipe(
      map(isAdminUser => {
        if (isAdminUser) {
          return true;
        }
        return new RedirectCommand(
          this.router.parseUrl("/login"),
          { state: { routeBeforeLogin: state.url } },
        );
      }),
    );
  }
}
