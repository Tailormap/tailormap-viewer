import { Directive, HostListener, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CancelCloseButtonService } from '../services/cancel-close-button-service';

@Directive({
  selector: '[tmCancelCloseButton]',
  standalone: false,
})
export class CancelCloseButtonDirective implements OnInit, OnDestroy {
  private routerLink = inject(RouterLink, { optional: true });
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  private cancelCloseButtonService = inject(CancelCloseButtonService);

  private handler = () => this.triggerAction();

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
      this.cancelCloseButtonService.triggerTop();
    }
  }

  private triggerAction() {
    if (this.routerLink?.urlTree) {
      this.router.navigateByUrl(this.routerLink.urlTree);
    }
    this.cancelClose.emit();
  }

  public ngOnInit(): void {
    this.cancelCloseButtonService.push(this.handler);
  }

  public ngOnDestroy(): void {
    this.cancelCloseButtonService.remove(this.handler);
  }

}
