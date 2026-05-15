import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticatedUserService } from '@tailormap-viewer/api';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private authenticatedUserService = inject(AuthenticatedUserService);


  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authenticatedUserService.createSecurityInterceptor(
      (userDetails) => {
        this.router.navigateByUrl('/login', {
          state: {
            hasInsufficientRights: userDetails.isAuthenticated,
            userName: userDetails.username,
            routeBeforeLogin: this.router.url,
          },
        });
      },
    )(req, next);
  }

}
