import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ApplicationEditLayersComponent } from '../application-edit-layers/application-edit-layers.component';

@Component({
    selector: 'tm-admin-application-edit-base-layers',
    templateUrl: './application-edit-base-layers.component.html',
    styleUrls: ['./application-edit-base-layers.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ApplicationEditLayersComponent],
})
export class ApplicationEditBaseLayersComponent {
}
