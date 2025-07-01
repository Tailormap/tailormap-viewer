import { Component, EventEmitter, HostBinding, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { style, transition, trigger, animate } from '@angular/animations';
import { DialogService } from './dialog.service';
import { BrowserHelper } from '@tailormap-viewer/shared';

const DEFAULT_WIDTH = 300;

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
  public dialogTitle = '';

  @Input()
  public hidden: boolean | null = false;

  @Input()
  public openFromRight: boolean | null = false;

  @Input()
  public allowCollapse: boolean | null = false;

  @Input()
  public collapsed: boolean | null = false;

  @Input()
  public width = DEFAULT_WIDTH;

  @Input()
  public widthMargin = 0;

  @Input()
  public allowFullscreen = false;

  @Output()
  public closeDialog = new EventEmitter();

  @Output()
  public expandCollapseDialog = new EventEmitter();

  @Output()
  public toggleFullscreenDialog = new EventEmitter<boolean>();

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

  public actualWidth = DEFAULT_WIDTH;
  public dialogId = '';

  public ngOnInit(): void {
    this.dialogId = this.dialogService.registerDialog(this.getLeft(), this.getRight());
  }

  public ngOnDestroy(): void {
    this.dialogService.unregisterDialog(this.dialogId);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.updateActualWidth();
    if (
      changes['hidden']?.currentValue !== changes['hidden']?.previousValue ||
      changes['open']?.currentValue !== changes['open']?.previousValue ||
      changes['openFromRight']?.currentValue !== changes['openFromRight']?.previousValue ||
      changes['width']?.currentValue !== changes['width']?.previousValue ||
      changes['maxWidth']?.currentValue !== changes['maxWidth']?.previousValue
    ) {
      this.dialogService.dialogChanged(this.dialogId, this.getLeft(), this.getRight());
    }
  }

  public updateActualWidth() {
    this.actualWidth = Math.min(this.width, BrowserHelper.getScreenWith() - this.widthMargin);
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

}
