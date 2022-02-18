import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TailormapApiV1Service } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {

  constructor(private tailormapApiService: TailormapApiV1Service) { }

  public ngOnInit(): void {
    // When login is the start of navigation, we do not have the XSRF token yet. Make sure to do a request to get it first.
    this.tailormapApiService.getVersion$().subscribe();
  }

}
