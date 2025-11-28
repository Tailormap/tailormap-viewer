import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CancelCloseButtonService {
  private stack: (() => void)[] = [];

  public push(handler: () => void) {
    this.stack.push(handler);
  }

  public remove(handler: () => void) {
    this.stack = this.stack.filter(h => h !== handler);
  }

  public triggerTop() {
    const top = this.stack[this.stack.length - 1];
    if (top) {
      top();
    }
  }
}
