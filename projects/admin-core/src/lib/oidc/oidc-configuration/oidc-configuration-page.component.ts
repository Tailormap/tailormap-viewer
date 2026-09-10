import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { NgClass, AsyncPipe } from '@angular/common';
import { OIDCConfigurationListComponent } from '../oidc-configuration-list/oidc-configuration-list.component';

@Component({
    selector: 'tm-admin-oidc-configuration-page',
    templateUrl: './oidc-configuration-page.component.html',
    styleUrls: ['./oidc-configuration-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgClass,
        OIDCConfigurationListComponent,
        RouterOutlet,
        AsyncPipe,
    ],
})
export class OIDCConfigurationPageComponent {
  private route = inject(ActivatedRoute);


  public className$: Observable<string>;

  constructor() {
    this.className$ = this.route.url
      .pipe(
        distinctUntilChanged(),
        map(() => {
          return this.route.snapshot.children.length > 0 ? this.route.snapshot.children[0].data['className'] : '';
        }),
      );
  }

}
