import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class DialogComponent implements OnInit {

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

  @Output()
  public closeDialog = new EventEmitter();

  @Output()
  public expandCollapseDialog = new EventEmitter();

  constructor() { }

  public ngOnInit(): void {
  }

  public close() {
    this.closeDialog.emit();
  }

  public expandCollapse() {
    this.expandCollapseDialog.emit();
  }

}
