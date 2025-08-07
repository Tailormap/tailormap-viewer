import { Injectable, inject } from '@angular/core';
import { CssHelper } from '@tailormap-viewer/shared';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private layoutService = inject(ViewerLayoutService);


  private dialogCount = 0;
  private dialogs: Array<{ id: string; left: number; right: number }> = [];
  private visibleStack: string[] = [];

  public registerDialog(left: number, right: number) {
    const id = `dialog-${++this.dialogCount}`;
    this.dialogs.push({ id, left, right });
    this.updateVisibleStack(id, left, right);
    return id;
  }

  public unregisterDialog(id: string) {
    this.dialogs = this.dialogs.filter(d => d.id !== id);
    this.visibleStack = this.visibleStack.filter(d => d !== id);
    this.updateStyle();
  }

  public dialogChanged(id: string, left: number, right: number) {
    this.dialogs = this.dialogs.map(dialog => {
      if (dialog.id === id) {
        return { ...dialog, left, right };
      }
      return dialog;
    });
    this.updateVisibleStack(id, left, right);
    this.updateStyle();
  }

  private updateVisibleStack(id: string, left: number, right: number) {
    const visible = left > 0 || right > 0;
    const idx = this.visibleStack.indexOf(id);
    if (visible && idx === -1) {
      this.visibleStack = [ ...this.visibleStack, id ];
    }
    if (!visible && idx !== -1) {
      this.visibleStack = [ ...this.visibleStack.slice(0, idx), ...this.visibleStack.slice(idx + 1) ];
    }
  }

  private updateStyle() {
    const maxDialogLeftWidth = this.dialogs.length === 0
      ? 0
      : Math.max(...this.dialogs.map(d => d.left));
    const maxDialogRightWidth = this.dialogs.length === 0
      ? 0
      : Math.max(...this.dialogs.map(d => d.right));
    CssHelper.setCssVariableValue('--dialog-width-left', `${maxDialogLeftWidth}px`);
    CssHelper.setCssVariableValue('--dialog-width-right', `${maxDialogRightWidth}px`);
    document.body.classList.toggle('body--has-dialog-left', maxDialogLeftWidth > 0);
    document.body.classList.toggle('body--has-dialog-right', maxDialogRightWidth > 0);
    this.visibleStack.forEach((id, idx) => {
      if (!id) {
        return;
      }
      CssHelper.setCssVariableValue('--dialog-stack-index', `${idx}`, document.querySelector<HTMLDivElement>(`.${id}`));
    });
    this.layoutService.setLeftPadding(maxDialogLeftWidth);
    this.layoutService.setRightPadding(maxDialogRightWidth);
  }

}
