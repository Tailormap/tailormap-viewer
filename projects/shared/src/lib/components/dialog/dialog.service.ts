import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DialogService {

  private dialogCount = 0;
  private dialogs: Array<{ id: string; left: number; right: number }> = [];
  private visibleStack: string[] = [];

  public registerDialog(left: number, right: number) {
    const id = `dialog-${++this.dialogCount}`;
    this.dialogs.push({ id, left, right });
    this.updateVisibleStack(id, left, right);
    return id;
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

  public updateVisibleStack(id: string, left: number, right: number) {
    const visible = left > 0 || right > 0;
    const idx = this.visibleStack.indexOf(id);
    if (visible && idx === -1) {
      this.visibleStack = [ ...this.visibleStack, id ];
    }
    if (!visible && idx !== -1) {
      this.visibleStack = [ ...this.visibleStack.slice(0, idx), ...this.visibleStack.slice(idx + 1) ];
    }
  }

  public getDialogZIndex(id: string) {
    return this.visibleStack.indexOf(id);
  }

  private updateStyle() {
    const maxDialogLeftWidth = Math.max(...this.dialogs.map(d => d.left));
    const maxDialogRightWidth = Math.max(...this.dialogs.map(d => d.right));
    document.body.style.setProperty('--dialog-width-left', `${maxDialogLeftWidth}px`);
    document.body.style.setProperty('--dialog-width-right', `${maxDialogRightWidth}px`);
    document.body.classList.toggle('body--has-dialog-left', maxDialogLeftWidth > 0);
    document.body.classList.toggle('body--has-dialog-right', maxDialogRightWidth > 0);
    this.visibleStack.forEach((id, idx) => {
      document.querySelector<HTMLDivElement>(`.${id}`)?.style.setProperty('--dialog-stack-index', `${idx}`);
    });
  }

}
