import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminPageTemplateComponent } from '../../templates/admin-page-template/admin-page-template.component';
import { GroupListComponent } from '../../user/group-list/group-list.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-groups-page',
    templateUrl: './groups-page.component.html',
    styleUrls: ['./groups-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminPageTemplateComponent,
        GroupListComponent,
        AsyncPipe,
    ],
})
export class GroupsPageComponent {

  public className$: Observable<string>;

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'className')
      .pipe(takeUntilDestroyed(destroyRef));
  }
}
