import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map, Observable } from 'rxjs';

@Component({
  selector: 'tm-admin-oidc-configuration-page',
  templateUrl: './oidc-configuration-page.component.html',
  styleUrls: ['./oidc-configuration-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OIDCConfigurationPageComponent {

  public className$: Observable<string>;

  constructor(
    private route: ActivatedRoute,
  ) {
    this.className$ = this.route.url
      .pipe(
        distinctUntilChanged(),
        map(() => {
          return this.route.snapshot.children.length > 0 ? this.route.snapshot.children[0].data['className'] : '';
        }),
      );
  }

}
