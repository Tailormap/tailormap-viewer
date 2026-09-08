import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-admin-search-index-home',
    templateUrl: './search-index-home.component.html',
    styleUrls: ['./search-index-home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton,
        RouterLink,
        MatIcon,
    ],
})
export class SearchIndexHomeComponent {
}
