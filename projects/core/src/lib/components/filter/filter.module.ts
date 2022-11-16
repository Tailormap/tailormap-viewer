import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterComponent } from './filter/filter.component';
import { FilterMenuButtonComponent } from './filter-menu-button/filter-menu-button.component';
import { MenubarModule } from '../menubar';
import { CreateFilterButtonComponent } from './create-filter-button/create-filter-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { FilterListComponent } from './filter-list/filter-list.component';
import { FilterListItemComponent } from './filter-list-item/filter-list-item.component';
import { FilterModule as CoreFilterModule } from '../../filter/filter.module';



@NgModule({
  declarations: [
    FilterComponent,
    FilterMenuButtonComponent,
    CreateFilterButtonComponent,
    FilterListComponent,
    FilterListItemComponent,
  ],
  imports: [
    CommonModule,
    MenubarModule,
    SharedModule,
    CoreFilterModule,
  ],
  exports: [
    FilterComponent,
  ],
})
export class FilterModule { }
