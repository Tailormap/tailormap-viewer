import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent, ViewerAppComponent } from './pages';

const routes: Routes = [
  // IMPORTANT: When you add a route, also add it to the FrontController class of tailormap-api, otherwise a user will get a 404 when
  // pressing F5 in their browser on your route.
  { path: 'login', component: LoginComponent },
  { path: 'app/:name', component: ViewerAppComponent },
  { path: 'app', component: ViewerAppComponent },
  { path: 'service/:name', component: ViewerAppComponent },
  {
    path: 'admin',
    loadChildren: () => import('@tailormap-admin/admin-core').then(m => m.AdminCoreModule),
    title: 'Tailormap Admin',
  },
  { path: '', component: ViewerAppComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class CoreRoutingModule { }
