import { Routes } from '@angular/router';
import { LoginComponent, ViewerAppComponent, PasswordResetComponent } from './pages';

export const coreRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'user/password-reset/:token', component: PasswordResetComponent },
  { path: 'app/:name', component: ViewerAppComponent },
  { path: 'app', component: ViewerAppComponent },
  { path: 'service/:name', component: ViewerAppComponent },
  {
    path: 'admin',
    loadChildren: () => import('@tailormap-admin/admin-core').then(m => m.adminRoutes),
    title: 'Tailormap Admin',
  },
  { path: '', component: ViewerAppComponent },
];
