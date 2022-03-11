import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { style, transition, trigger, animate } from '@angular/animations';

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
  public title = '';

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

  constructor() { }

  public ngOnInit(): void {
    if (this.openFromRight) {

    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['hidden']?.currentValue !== changes['hidden']?.previousValue ||
      changes['open']?.currentValue !== changes['open']?.previousValue ||
      changes['openFromRight']?.currentValue !== changes['openFromRight']?.previousValue ||
      changes['width']?.currentValue !== changes['width']?.previousValue
    ) {
      const hidden = !this.open || this.hidden;
      const left = hidden || this.openFromRight ? 0 : this.width;
      const right = hidden || !this.openFromRight ? 0 : this.width;
      document.body.style.setProperty('--dialog-width-left', `${left}px`);
      document.body.style.setProperty('--dialog-width-right', `${right}px`);
      document.body.classList.toggle('body--has-dialog-left', left > 0);
      document.body.classList.toggle('body--has-dialog-right', right > 0);
    }
  }

  public close() {
    this.closeDialog.emit();
  }

  public expandCollapse() {
    this.expandCollapseDialog.emit();
  }

}
