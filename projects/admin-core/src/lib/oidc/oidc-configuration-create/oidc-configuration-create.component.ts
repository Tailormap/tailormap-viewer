import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { OIDCConfigurationService } from '../services/oidc-configuration.service';
import { Router } from '@angular/router';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';

@Component({
  selector: 'tm-admin-oidc-configuration-create',
  templateUrl: './oidc-configuration-create.component.html',
  styleUrls: ['./oidc-configuration-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OIDCConfigurationCreateComponent implements OnDestroy {
  private oidcConfigurationService = inject(OIDCConfigurationService);
  private router = inject(Router);
  private adminSnackbarService = inject(AdminSnackbarService);


  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public oidcConfiguration: Omit<OIDCConfigurationModel, 'id'> | null = null;

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateOIDCConfiguration($event: Omit<OIDCConfigurationModel, 'id'>) {
    this.oidcConfiguration = $event;
  }

  public save() {
    if (!this.oidcConfiguration) {
      return;
    }
    this.savingSubject.next(true);
    this.oidcConfigurationService.createOIDCConfiguration$(this.oidcConfiguration)
      .pipe(takeUntil(this.destroyed))
      .subscribe(createdOIDCConfiguration => {
        if (createdOIDCConfiguration) {
          this.adminSnackbarService.showMessage($localize `:@@admin-core.oidc.configuration-created:OIDC configuration ${createdOIDCConfiguration.name} created`);
          this.router.navigateByUrl('/admin/settings/oidc-configurations/oidc-configuration/' + createdOIDCConfiguration.id);
        }
        this.savingSubject.next(false);
      });
  }
}
