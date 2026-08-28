import { Injectable, inject } from '@angular/core';
import { CssHelper } from '@tailormap-viewer/shared';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';
import { VIEWER_ROOT_ELEMENT } from '../../../viewer-instance/viewer-root-element.token';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private layoutService = inject(ViewerLayoutService);
  private rootElement = inject(VIEWER_ROOT_ELEMENT);


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
    CssHelper.setCssVariableValue('--dialog-width-left', `${maxDialogLeftWidth}px`, this.rootElement);
    CssHelper.setCssVariableValue('--dialog-width-right', `${maxDialogRightWidth}px`, this.rootElement);
    this.rootElement.classList.toggle('has-dialog-left', maxDialogLeftWidth > 0);
    this.rootElement.classList.toggle('has-dialog-right', maxDialogRightWidth > 0);
    this.visibleStack.forEach((id, idx) => {
      if (!id) {
        return;
      }
      CssHelper.setCssVariableValue('--dialog-stack-index', `${idx}`, this.rootElement.querySelector<HTMLDivElement>(`.${id}`));
    });
    this.layoutService.setLeftPadding(maxDialogLeftWidth);
    this.layoutService.setRightPadding(maxDialogRightWidth);
  }

}
