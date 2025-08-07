import { NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { UserListComponent } from './user-list/user-list.component';
import { GroupListComponent } from './group-list/group-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { GroupFormComponent } from './group-form/group-form.component';
import { UserHomeComponent } from './user-home/user-home.component';
import { UserCreateComponent } from './user-create/user-create.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { RouterModule } from '@angular/router';
import { SharedAdminComponentsModule } from '../shared/components/shared-admin-components.module';
import { GroupHomeComponent } from './group-home/group-home.component';
import { GroupEditComponent } from './group-edit/group-edit.component';
import { GroupCreateComponent } from './group-create/group-create.component';
import { StoreModule } from '@ngrx/store';
import { userStateKey } from './state/user.state';
import { userReducer } from './state/user.reducer';
import { EffectsModule } from '@ngrx/effects';
import { UserEffects } from './state/user.effects';
import { UserService } from './services/user.service';
import { GroupService } from './services/group.service';

@NgModule({
  declarations: [
    UserListComponent,
    GroupListComponent,
    UserFormComponent,
    GroupFormComponent,
    UserHomeComponent,
    UserCreateComponent,
    UserEditComponent,
    GroupHomeComponent,
    GroupEditComponent,
    GroupCreateComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    SharedAdminComponentsModule,
    StoreModule.forFeature(userStateKey, userReducer),
    EffectsModule.forFeature([UserEffects]),
  ],
  exports: [
    UserListComponent,
    GroupListComponent,
  ],
})
export class UserModule {
  constructor() {
    const userService = inject(UserService);
    const groupService = inject(GroupService);

    userService.listenForUserChanges();
    groupService.listenForGroupChanges();
  }
}
