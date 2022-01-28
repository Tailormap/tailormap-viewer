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
  public open: boolean | null = null;

  @Input()
  public title = '';

  @Input()
  public subtitle = '';

  @Input()
  public hidden = false;

  @Input()
  public openFromRight = false;

  @Output()
  public closeOverlay = new EventEmitter();

  constructor() { }

  public ngOnInit(): void {
  }

  public close() {
    this.closeOverlay.emit();
  }

}
