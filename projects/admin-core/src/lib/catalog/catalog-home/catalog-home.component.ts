import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CatalogCreateButtonsComponent } from '../catalog-create-buttons/catalog-create-buttons.component';

@Component({
    selector: 'tm-admin-catalog-home',
    templateUrl: './catalog-home.component.html',
    styleUrls: ['./catalog-home.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CatalogCreateButtonsComponent],
})
export class CatalogHomeComponent {
}
