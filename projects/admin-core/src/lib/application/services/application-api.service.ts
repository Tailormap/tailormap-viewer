import { Injectable, inject } from '@angular/core';
import { ApplicationService } from './application.service';

/*
`ApplicationApiService` is responsible for providing limited access for plugins to application-related operations.
*/
@Injectable({
  providedIn: 'root',
})
export class ApplicationApiService {
  private applicationService = inject(ApplicationService);


  public getApplications$() {
    return this.applicationService.getApplications$();
  }

}
