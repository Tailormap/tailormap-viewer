import { Router } from '@angular/router';
import { interval, switchMap, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Inject, Injectable } from '@angular/core';
import { TAILORMAP_SECURITY_API_V1_SERVICE, TailormapSecurityApiV1ServiceModel } from '@tailormap-viewer/api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {

  private isAuthenticated = false;

  constructor(
    @Inject(TAILORMAP_SECURITY_API_V1_SERVICE) private api: TailormapSecurityApiV1ServiceModel,
    private destroyRef: DestroyRef,
    private dialogService: ConfirmDialogService,
    private router: Router,
  ) {
  }

  public pingUserLoggedIn() {
    interval(1000 * 50)
      .pipe(takeUntilDestroyed(this.destroyRef), switchMap(() => this.api.getUser$()))
      .subscribe(userDetails => {
        if (!this.isAuthenticated && userDetails.isAuthenticated) {
          this.isAuthenticated = true;
        }
        if (this.isAuthenticated && !userDetails.isAuthenticated) {
          this.dialogService.confirm$(
            `You are logged out`,
            `You are logged out and need to log in first before continuing`,
            false,
            `Login`,
            '',
            true,
          )
            .pipe(take(1))
            .subscribe(() => {
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
