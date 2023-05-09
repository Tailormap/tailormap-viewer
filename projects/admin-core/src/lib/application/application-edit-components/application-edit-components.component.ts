import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'tm-admin-application-edit-components',
  templateUrl: './application-edit-components.component.html',
  styleUrls: ['./application-edit-components.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditComponentsComponent {

  private selectedComponentSubject = new BehaviorSubject<string>('');
  public selectedComponent$ = this.selectedComponentSubject.asObservable();

  public setSelectedComponent(value: string) {
    this.selectedComponentSubject.next(value);
  }

}
