import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlMatcher, UrlSegment } from '@angular/router';
import { LoginComponent, ViewerAppComponent } from './pages';

const matchById: UrlMatcher = (urls: UrlSegment[]) => {
  if (urls.length > 1 && urls[0].path === 'app' && /\d+/.test(urls[1].path)) {
    return {
      consumed: urls,
      posParams: { id: urls[1] },
    };
  }
  return null;
};

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'app/:name/:version', component: ViewerAppComponent },
  { matcher: matchById, component: ViewerAppComponent },
  { path: 'app/:name', component: ViewerAppComponent },
  { path: 'app', component: ViewerAppComponent },
  { path: '', component: ViewerAppComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class CoreRoutingModule { }
