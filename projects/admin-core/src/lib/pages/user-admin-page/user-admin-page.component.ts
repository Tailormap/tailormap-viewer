import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPageTemplateComponent } from '../../templates/admin-page-template/admin-page-template.component';
import { UserListComponent } from '../../user/user-list/user-list.component';

@Component({
    selector: 'tm-admin-user-admin-page',
    templateUrl: './user-admin-page.component.html',
    styleUrls: ['./user-admin-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ AdminPageTemplateComponent, UserListComponent ],
})
export class UserAdminPageComponent {
}
