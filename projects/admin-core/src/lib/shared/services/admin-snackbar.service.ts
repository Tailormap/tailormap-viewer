import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class AdminSnackbarService {
  private snackBar = inject(MatSnackBar);


  public showMessage(msg?: string) {
    return SnackBarMessageComponent.open$(this.snackBar, {
      message: msg || $localize `:@@admin-core.common.saved:Saved`,
      duration: msg ? 8000 : 5000,
      showDuration: true,
      showCloseButton: true,
    });
  }

}
