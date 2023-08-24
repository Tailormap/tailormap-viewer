import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassNameHelper } from '../helpers/class-name.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-catalog-page',
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {
  public className$: Observable<string>;

  constructor(
    route: ActivatedRoute,
    router: Router,
    destroyRef: DestroyRef,
  ) {
    this.className$ = ClassNameHelper.getClassNameForRoute$(router, route)
      .pipe(takeUntilDestroyed(destroyRef));
  }
}
