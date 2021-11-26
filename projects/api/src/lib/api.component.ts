import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tm-api',
  template: `
    <p>
      api works!
      <span class="message">{{ hello }}</span>
      <button (click)="updateMessage()">Update the message</button>
    </p>
  `,
  styles: [
  ],
})
export class ApiComponent implements OnInit {

  public hello = 'there';

  constructor() { }

  public ngOnInit(): void {}

  public updateMessage() {
    this.hello = 'who are you?';
  }

}
