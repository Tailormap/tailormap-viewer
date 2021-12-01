import { Component, OnInit } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'tm-shared',
  template: `
    <button mat-flat-button>Test</button>
    <span>{{message$ | async}}</span>
  `,
  styles: [
  ],
})
export class SharedComponent implements OnInit {

  public message$: Observable<string>;

  constructor(
    private sharedService: SharedService,
  ) {
    this.message$ = this.sharedService.getMessage$();
  }

  public ngOnInit(): void {
  }

}
