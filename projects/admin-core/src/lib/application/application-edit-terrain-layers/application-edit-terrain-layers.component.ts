import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ApplicationEditLayersComponent } from '../application-edit-layers/application-edit-layers.component';

@Component({
    selector: 'tm-admin-application-edit-terrain-layers',
    templateUrl: './application-edit-terrain-layers.component.html',
    styleUrls: ['./application-edit-terrain-layers.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ApplicationEditLayersComponent],
})
export class ApplicationEditTerrainLayersComponent {
}
