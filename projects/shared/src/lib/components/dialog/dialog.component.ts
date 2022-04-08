import { Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { style, transition, trigger, animate } from '@angular/animations';
import { DialogService } from './dialog.service';

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
})
export class DialogComponent implements OnInit, OnChanges {

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
  public width = 300;

  @Output()
  public closeDialog = new EventEmitter();

  @Output()
  public expandCollapseDialog = new EventEmitter();

  @HostBinding('class')
  public get dialogAsClass() {
    return this.dialogId;
  }

  public dialogId = '';

  constructor(
    private dialogService: DialogService,
  ) { }

  public ngOnInit(): void {
    this.dialogId = this.dialogService.registerDialog(this.getLeft(), this.getRight());
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['hidden']?.currentValue !== changes['hidden']?.previousValue ||
      changes['open']?.currentValue !== changes['open']?.previousValue ||
      changes['openFromRight']?.currentValue !== changes['openFromRight']?.previousValue ||
      changes['width']?.currentValue !== changes['width']?.previousValue
    ) {
      this.dialogService.dialogChanged(this.dialogId, this.getLeft(), this.getRight());
    }
  }

  private getHidden() {
    return !this.open || this.hidden;
  }

  private getLeft() {
    return this.getHidden() || this.openFromRight ? 0 : this.width;
  }

  private getRight() {
    return this.getHidden() || !this.openFromRight ? 0 : this.width;
  }

  public close() {
    this.closeDialog.emit();
  }

  public expandCollapse() {
    this.expandCollapseDialog.emit();
  }

}
