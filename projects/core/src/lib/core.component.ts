import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tm-core',
  template: `
    <p>
      core works!
    </p>
  `,
  styles: [
  ],
})
export class CoreComponent implements OnInit {

  constructor() { }

  public ngOnInit(): void {
  }

}
