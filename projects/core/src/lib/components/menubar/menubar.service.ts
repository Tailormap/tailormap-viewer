import { Injectable } from '@angular/core';
import { BaseComponentRegistryService } from '@tailormap-viewer/shared';
import { BehaviorSubject, map } from 'rxjs';
import { DRAWING_ID } from '../drawing/drawing-identifier';

@Injectable({
  providedIn: 'root',
})
export class MenubarService extends BaseComponentRegistryService {

  private activeComponent$ = new BehaviorSubject<{ componentId: string; dialogTitle: string } | null>(null);

  public toggleActiveComponent(componentId: string, dialogTitle: string) {
    if (this.activeComponent$.value?.componentId === componentId) {
      this.closePanel();
      return;
    }
    this.activeComponent$.next({ componentId, dialogTitle });
  }

  public closePanel() {
    this.activeComponent$.next(null);
  }

  public getActiveComponent$() {
    return this.activeComponent$.asObservable();
  }

  public isComponentVisible$(componentId: string) {
    return this.activeComponent$.asObservable().pipe(map(c => c !== null && c.componentId === componentId));
  }

}
