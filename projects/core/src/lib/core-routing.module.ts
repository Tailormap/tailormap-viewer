import { NgModule } from '@angular/core';
import { NavigationError, Router, RouterModule, Routes } from '@angular/router';
import { LoginComponent, ViewerAppComponent } from './pages';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class CoreRoutingModule {
  constructor(private router: Router) {
    // Use an alternative catch-all route instead of '**', this allows libraries to add routes
    router.events.pipe(
      takeUntilDestroyed(),
      filter(event => event instanceof NavigationError),
    ).subscribe(() => {
      this.router.navigate(['app']);
    });
  }
}
