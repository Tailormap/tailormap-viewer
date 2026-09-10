import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminPageTemplateComponent } from '../../templates/admin-page-template/admin-page-template.component';
import { FormListComponent } from '../../form/form-list/form-list.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-form-page',
    templateUrl: './form-page.component.html',
    styleUrls: ['./form-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminPageTemplateComponent,
        FormListComponent,
        AsyncPipe,
    ],
})
export class FormPageComponent {

  public className$: Observable<string>;

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'className')
      .pipe(takeUntilDestroyed(destroyRef));
  }

}
