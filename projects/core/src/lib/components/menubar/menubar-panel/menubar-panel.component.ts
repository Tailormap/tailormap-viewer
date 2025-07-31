import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { MenubarService } from '../menubar.service';
import { BehaviorSubject, first, Observable, switchMap } from 'rxjs';
import { CssHelper } from '@tailormap-viewer/shared';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'tm-menubar-panel',
  templateUrl: './menubar-panel.component.html',
  styleUrls: ['./menubar-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MenubarPanelComponent implements OnDestroy {

  public activeComponent$: Observable<{ componentId: string; dialogTitle: string } | null>;
  private dialogRegisteredSubject$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  public panelWidth = 300;
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width');

  constructor(
    private menubarService: MenubarService,
  ) {
    this.activeComponent$ = this.dialogRegisteredSubject$.asObservable().pipe(
      first(dialogId => dialogId !== ''),
      switchMap(() => this.menubarService.getActiveComponent$()),
      debounceTime(0),
    );
    this.panelWidth = menubarService.panelWidth;
  }

  public ngOnDestroy() {
    this.menubarService.closePanel();
  }

  public closeDialog() {
    this.menubarService.closePanel();
  }

  public onDialogRegistered(dialogId: string) {
    this.dialogRegisteredSubject$.next(dialogId);
  }

}
