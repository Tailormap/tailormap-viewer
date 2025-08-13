import { Router } from '@angular/router';
import { interval, switchMap, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { TAILORMAP_SECURITY_API_V1_SERVICE } from '@tailormap-viewer/api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class UserLoginCheckService {
  private api = inject(TAILORMAP_SECURITY_API_V1_SERVICE);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(ConfirmDialogService);
  private router = inject(Router);


  private isAuthenticated = false;
  private confirmOpen = false;

  private loginButtonLabel = $localize `:@@core.common:Login`;
  private messageTitle = $localize `:@@core.user-login-check-title:You are logged out`;
  private viewerMessageBody = $localize `:@@core.user-login-check-viewer-message:You are logged out and might need to login again`;
  private adminMessageBody = $localize `:@@core.user-login-check-admin-message:You are logged out and need to log in first before continuing`;

  public pingUserLoggedIn() {
    interval(1000 * 50)
      .pipe(takeUntilDestroyed(this.destroyRef), switchMap(() => this.api.getUser$()))
      .subscribe(userDetails => {
        if (!this.isAuthenticated && userDetails.isAuthenticated) {
          this.isAuthenticated = true;
        }
        if (userDetails.isHttpError) {
          // offline, network change, etc. Not sure if actually logged out, may be a temporary failure: do not show popup
          return;
        }
        if (this.isAuthenticated && !userDetails.isAuthenticated && !this.confirmOpen) {
          if (this.router.url.includes('/login')) {
            this.isAuthenticated = false;
            return;
          }
          this.confirmOpen = true;
          const inAdmin = this.router.url.includes('/admin');
          this.dialogService.confirm$(
            this.messageTitle,
            inAdmin ? this.adminMessageBody : this.viewerMessageBody,
            false,
            this.loginButtonLabel,
            '',
            true,
          )
            .pipe(take(1))
            .subscribe(() => {
              this.isAuthenticated = false;
              this.confirmOpen = false;
              this.router.navigateByUrl('/login', {
                state: {
                  hasInsufficientRights: false,
                  userName: userDetails.username,
                  routeBeforeLogin: this.router.url,
                },
              });
            });
        }
      });
  }

}
