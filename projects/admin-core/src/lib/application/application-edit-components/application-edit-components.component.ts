import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ComponentsListComponent } from '../components/components-list/components-list.component';
import { ComponentConfigRendererComponent } from '../components/component-config-renderer/component-config-renderer.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-application-edit-components',
    templateUrl: './application-edit-components.component.html',
    styleUrls: ['./application-edit-components.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ComponentsListComponent,
        ComponentConfigRendererComponent,
        AsyncPipe,
    ],
})
export class ApplicationEditComponentsComponent {

  private selectedComponentSubject = new BehaviorSubject<string | null>(null);
  public selectedComponent$ = this.selectedComponentSubject.asObservable();

  public setSelectedComponent(value: string | null) {
    this.selectedComponentSubject.next(value);
  }

}
