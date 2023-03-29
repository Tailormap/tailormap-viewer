import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@tailormap-viewer/shared';
import { UserlistComponent } from './userlist/userlist.component';
import { GrouplistComponent } from './grouplist/grouplist.component';
import { UserdetailsFormComponent } from './userdetails-form/userdetails-form.component';
import { MatListModule } from '@angular/material/list';
import { GroupdetailsFormComponent } from './groupdetails-form/groupdetails-form.component';

@NgModule({
  declarations: [
    UserlistComponent,
    GrouplistComponent,
    UserdetailsFormComponent,
    GroupdetailsFormComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatListModule,
  ],
  exports: [
    UserlistComponent,
    GrouplistComponent,
    UserdetailsFormComponent,
    GroupdetailsFormComponent,
  ],
})
export class UseradminModule {
}
