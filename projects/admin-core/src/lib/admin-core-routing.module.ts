import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { RoutesEnum } from './routes';

const routes: Routes = [
  { path: RoutesEnum.CATALOG, component: CatalogPageComponent },
  { path: RoutesEnum.ADMIN_HOME, component: AdminHomePageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
