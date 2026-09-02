import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-oidc-configuration-home',
    templateUrl: './oidc-configuration-home.component.html',
    styleUrls: ['./oidc-configuration-home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton,
        RouterLink,
        MatIcon,
    ],
})
export class OIDCConfigurationHomeComponent {
}
