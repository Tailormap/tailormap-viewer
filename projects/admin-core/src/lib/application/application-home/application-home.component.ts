import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-application-home',
    templateUrl: './application-home.component.html',
    styleUrls: ['./application-home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton,
        RouterLink,
        MatIcon,
    ],
})
export class ApplicationHomeComponent {
}
