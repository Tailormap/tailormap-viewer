import { Injectable } from '@angular/core';
import { ApplicationService } from './application.service';

/*
`ApplicationApiService` is responsible for providing limited access for plugins to application-related operations.
*/
@Injectable({
  providedIn: 'root',
})
export class ApplicationApiService {

  constructor(
    private applicationService: ApplicationService,
  ) {
  }

  public getApplications$() {
    return this.applicationService.getApplications$();
  }

}
