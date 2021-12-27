import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewerAppComponent } from './pages/viewer-app/viewer-app.component';

const routes: Routes = [
  { path: '', component: ViewerAppComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class CoreRoutingModule { }
