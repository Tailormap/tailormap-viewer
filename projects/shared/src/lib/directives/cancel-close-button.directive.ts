import { Directive, HostListener, Output, EventEmitter, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Directive({
  selector: '[tmCancelCloseButton]',
  standalone: false,
})
export class CancelCloseButtonDirective {
  private routerLink = inject(RouterLink, { optional: true });
  private matDialog = inject(MatDialog);
  private router = inject(Router);


  @Output()
  public cancelClose = new EventEmitter<void>();

  @HostListener('click')
  public onClick() {
    this.triggerAction();
  }

  @HostListener('window:keydown.escape', ['$event'])
  public onEscape(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (this.matDialog.openDialogs.length === 0) {
      this.triggerAction();
    }
  }

  private triggerAction() {
    if (this.routerLink?.urlTree) {
      this.router.navigateByUrl(this.routerLink.urlTree);
    }
    this.cancelClose.emit();
  }
}
