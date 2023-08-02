import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-application-edit-components',
  templateUrl: './application-edit-components.component.html',
  styleUrls: ['./application-edit-components.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditComponentsComponent {

  private selectedComponentSubject = new BehaviorSubject<BaseComponentTypeEnum | null>(null);
  public selectedComponent$ = this.selectedComponentSubject.asObservable();

  public setSelectedComponent(value: BaseComponentTypeEnum | null) {
    this.selectedComponentSubject.next(value);
  }

}
