import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { style, transition, trigger, animate } from '@angular/animations';
import { DialogService } from './dialog.service';
import { BrowserHelper } from '@tailormap-viewer/shared';

const DIALOG_DEFAULT_WIDTH = 300;

@Component({
  selector: 'tm-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
  animations: [
    trigger(
      'inOutAnimation',
      [
        transition(':enter', [
          style({ transform: 'translate({{translate}})', opacity: 0 }),
          animate('0.25s ease-out', style({ transform: 'translate(0)', opacity: 1 })),
        ]),
        transition(':leave', [
          style({ transform: 'translate(0)', opacity: 1 }),
          animate('0.25s ease-out', style({ transform: 'translate({{translate}})', opacity: 0 })),
        ]),
      ],
    ),
  ],
  standalone: false,
})
export class DialogComponent implements OnInit, OnChanges, OnDestroy {
  private dialogService = inject(DialogService);


  @Input()
  public open: boolean | null = false;

  @Input()
  public dialogTitle: string | null = '';

  @Input()
  public hidden: boolean | null = false;

  @Input()
  public openFromRight: boolean | null = false;

  @Input()
  public allowCollapse: boolean | null = false;

  @Input()
  public collapsed: boolean | null = false;

  @Input()
  public width = DIALOG_DEFAULT_WIDTH;

  @Input()
  public widthMargin = 0;

  @Input()
  public allowFullscreen = false;

  @Input()
  public allowResize = false;

  @Input()
  public minWidth = DIALOG_DEFAULT_WIDTH;

  @Input()
  public maxWidth: number | null = null;

  @Output()
  public closeDialog = new EventEmitter();

  @Output()
  public expandCollapseDialog = new EventEmitter();

  @Output()
  public toggleFullscreenDialog = new EventEmitter<boolean>();

  @Output()
  public widthChanged = new EventEmitter<number>();

  public fullscreen = false;

  @HostBinding('class')
  public get dialogAsClass() {
    return this.dialogId;
  }

  @HostListener('window:resize', ['$event'])
  public onResize() {
    this.updateActualWidth();
    this.dialogService.dialogChanged(this.dialogId, this.getLeft(), this.getRight());
  }

  public actualWidth = DIALOG_DEFAULT_WIDTH;
  public dialogId = '';
  private resizeActive = false;
  private resizeStartX = 0;
  private resizeStartWidth = DIALOG_DEFAULT_WIDTH;
  private readonly RESIZE_KEYBOARD_STEP = 10;

  public ngOnInit(): void {
    this.dialogId = this.dialogService.registerDialog(this.getLeft(), this.getRight());
  }

  public ngOnDestroy(): void {
    this.stopResize();
    this.dialogService.unregisterDialog(this.dialogId);
  }

  @HostListener('document:pointermove', ['$event']) public onDocumentPointerMove(event: PointerEvent) {
    if (!this.resizeActive) {
      return;
    }
    const delta = this.openFromRight ? this.resizeStartX - event.clientX : event.clientX - this.resizeStartX;
    const maxWidth = this.getMaxAllowedWidth();
    const nextWidth = Math.max(this.minWidth, Math.min(this.resizeStartWidth + delta, maxWidth));
    if (nextWidth !== this.width) {
      this.width = nextWidth;
      this.updateActualWidth();
      this.widthChanged.emit(nextWidth);
      this.dialogService.dialogChanged(this.dialogId, this.getLeft(), this.getRight());
    }
  }

  @HostListener('document:pointerup') public onDocumentPointerUp() {
    this.stopResize();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.updateActualWidth();
    if (
      changes['hidden']?.currentValue !== changes['hidden']?.previousValue ||
      changes['open']?.currentValue !== changes['open']?.previousValue ||
      changes['openFromRight']?.currentValue !== changes['openFromRight']?.previousValue ||
      changes['width']?.currentValue !== changes['width']?.previousValue ||
      changes['maxWidth']?.currentValue !== changes['maxWidth']?.previousValue ||
      changes['minWidth']?.currentValue !== changes['minWidth']?.previousValue
    ) {
      this.dialogService.dialogChanged(this.dialogId, this.getLeft(), this.getRight());
    }
  }

  public updateActualWidth() {
    this.actualWidth = Math.max(this.minWidth, Math.min(this.width, this.getMaxAllowedWidth()));
  }

  protected getMaxAllowedWidth(): number {
    const viewportMaxWidth = BrowserHelper.getScreenWith() - this.widthMargin;
    return this.maxWidth !== null ? Math.min(this.maxWidth, viewportMaxWidth) : viewportMaxWidth;
  }

  public startResize(event: PointerEvent) {
    if (!this.allowResize || this.fullscreen) {
      return;
    }
    event.preventDefault();
    this.resizeActive = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.width;
    document.body.classList.add('resize-active');
  }

  public onResizeHandleKeyDown(event: KeyboardEvent) {
    if (!this.allowResize || this.fullscreen) {
      return;
    }
    let newWidth: number | null = null;
    const maxWidth = this.getMaxAllowedWidth();

    if (this.openFromRight && event.key === 'ArrowLeft') {
      newWidth = Math.min(this.width + this.RESIZE_KEYBOARD_STEP, maxWidth);
    } else if (this.openFromRight && event.key === 'ArrowRight') {
      newWidth = Math.max(this.width - this.RESIZE_KEYBOARD_STEP, this.minWidth);
    } else if (!this.openFromRight && event.key === 'ArrowRight') {
      newWidth = Math.min(this.width + this.RESIZE_KEYBOARD_STEP, maxWidth);
    } else if (!this.openFromRight && event.key === 'ArrowLeft') {
      newWidth = Math.max(this.width - this.RESIZE_KEYBOARD_STEP, this.minWidth);
    }

    if (newWidth !== null && newWidth !== this.width) {
      event.preventDefault();
      this.width = newWidth;
      this.updateActualWidth();
      this.widthChanged.emit(newWidth);
      this.dialogService.dialogChanged(this.dialogId, this.getLeft(), this.getRight());
    }
  }

  private stopResize() {
    if (!this.resizeActive) {
      return;
    }
    this.resizeActive = false;
    document.body.classList.remove('resize-active');
  }

  private getHidden() {
    return !this.open || this.hidden;
  }

  private getLeft() {
    return this.getHidden() || this.openFromRight ? 0 : this.actualWidth;
  }

  private getRight() {
    return this.getHidden() || !this.openFromRight ? 0 : this.actualWidth;
  }

  public close() {
    this.closeDialog.emit();
  }

  public expandCollapse() {
    this.expandCollapseDialog.emit();
  }

  public toggleFullscreen(force?: boolean) {
    this.fullscreen = typeof force === 'boolean' ? force : !this.fullscreen;
    this.toggleFullscreenDialog.emit(this.fullscreen);
  }

  public getExpandCollapseTooltip() {
    return this.collapsed
      ? $localize`:@@core.dialog.expand-panel:Expand panel`
      : $localize`:@@core.dialog.collapse-panel:Collapse panel`;
  }

  public getResizeHandleLabel(): string {
    return $localize`:@@core.dialog.resize-panel:Resize panel`;
  }
}
