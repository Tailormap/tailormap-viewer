import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-group-home',
    templateUrl: './group-home.component.html',
    styleUrls: ['./group-home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton,
        RouterLink,
        MatIcon,
    ],
})
export class GroupHomeComponent {
}
