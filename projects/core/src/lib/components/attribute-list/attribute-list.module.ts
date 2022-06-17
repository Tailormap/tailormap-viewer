import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule, SharedImportsModule } from '@tailormap-viewer/shared';
import { AttributeListMenuButtonComponent } from './attribute-list-menu-button/attribute-list-menu-button.component';
import { AttributeListComponent } from './attribute-list/attribute-list.component';
import { AttributeListTabComponent } from './attribute-list-tab/attribute-list-tab.component';

@NgModule({
  declarations: [
    AttributeListComponent,
    AttributeListMenuButtonComponent,
    AttributeListTabComponent,
  ],
  imports: [
    CommonModule,
    SharedImportsModule,
    SharedComponentsModule,
  ],
})
export class AttributeListModule { }
