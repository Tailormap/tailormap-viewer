import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tm-admin-template',
  templateUrl: './admin-template.component.html',
  styleUrls: ['./admin-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTemplateComponent implements OnInit {

  @Input()
  public pageTitle = '';

  constructor() { }

  public ngOnInit(): void {
  }

  public login() {
    fetch('http://localhost:4201/api/user').then(r => r.json().then(user => {
      if (!user.isAuthenticated) {
        const token = new URLSearchParams((document.cookie || '').replace(/; /g, '&')).get('XSRF-TOKEN');
        fetch('http://localhost:4201/api/login', {
          // @ts-ignore
          headers: {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'x-xsrf-token': token,
          },
          body: 'username=tm-admin&password=tm-admin',
          method: 'POST',
        }).then(_ => {
          window.location.reload();
        });
      }
    }));
  }

}
