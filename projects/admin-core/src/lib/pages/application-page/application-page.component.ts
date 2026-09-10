import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminPageTemplateComponent } from '../../templates/admin-page-template/admin-page-template.component';
import { ApplicationListComponent } from '../../application/application-list/application-list.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-application-page',
    templateUrl: './application-page.component.html',
    styleUrls: ['./application-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminPageTemplateComponent,
        ApplicationListComponent,
        AsyncPipe,
    ],
})
export class ApplicationPageComponent {

  public className$: Observable<string>;

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'className')
      .pipe(takeUntilDestroyed(destroyRef));
  }

}
