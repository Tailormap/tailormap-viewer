import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Routes as AdminRoutes } from './routes';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { CatalogHomeComponent } from './catalog/catalog-home/catalog-home.component';
import { GeoServiceLayerDetailsComponent } from './catalog/geo-service-layer-details/geo-service-layer-details.component';
import { GeoServiceDetailsComponent } from './catalog/geo-service-details/geo-service-details.component';
import { CatalogNodeDetailsComponent } from './catalog/catalog-node-details/catalog-node-details.component';
import { FeatureSourceDetailsComponent } from './catalog/feature-source-details/feature-source-details.component';
import { FeatureTypeDetailsComponent } from './catalog/feature-type-details/feature-type-details.component';
import { ApplicationPageComponent } from './pages/application-page/application-page.component';
import { ApplicationHomeComponent } from './application/application-home/application-home.component';
import { ApplicationCreateComponent } from './application/application-create/application-create.component';
import { ApplicationEditComponent } from './application/application-edit/application-edit.component';
import { ApplicationEditSettingsComponent } from './application/application-edit-settings/application-edit-settings.component';
import { ApplicationEditLayersComponent } from './application/application-edit-layers/application-edit-layers.component';
import { ApplicationEditBaseLayersComponent } from './application/application-edit-base-layers/application-edit-base-layers.component';
import { ApplicationEditComponentsComponent } from './application/application-edit-components/application-edit-components.component';
import { ApplicationEditStylingComponent } from './application/application-edit-styling/application-edit-styling.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { AdminHomePageComponent } from './pages/admin-home-page/admin-home-page.component';
import { UserAdminPageComponent } from './pages/user-admin-page/user-admin-page.component';
import { UserHomeComponent } from './user/user-home/user-home.component';
import { UserCreateComponent } from './user/user-create/user-create.component';
import { UserEditComponent } from './user/user-edit/user-edit.component';
import { GroupsPageComponent } from './pages/groups-page/groups-page.component';
import { GroupHomeComponent } from './user/group-home/group-home.component';
import { GroupCreateComponent } from './user/group-create/group-create.component';
import { GroupEditComponent } from './user/group-edit/group-edit.component';
import { SettingsHomePageComponent } from './settings/settings-home-page/settings-home-page.component';
import { AdminTemplateComponent } from './templates/admin-template/admin-template.component';
import { FormPageComponent } from './pages/form-page/form-page.component';
import { FormHomeComponent } from './form/form-home/form-home.component';
import { FormCreateComponent } from './form/form-create/form-create.component';
import { FormEditComponent } from './form/form-edit/form-edit.component';
import { SearchIndexPageComponent } from './pages/search-index-page/search-index-page.component';
import { SearchIndexHomeComponent } from './search-index/search-index-home/search-index-home.component';
import { SearchIndexEditComponent } from './search-index/search-index-edit/search-index-edit.component';
import { SearchIndexCreateComponent } from './search-index/search-index-create/search-index-create.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminTemplateComponent,
    children: [
      {
        path: AdminRoutes.CATALOG,
        component: CatalogPageComponent,
        data: { pageTitle: $localize `:@@admin-core.common.catalog-title:Catalog` },
        children: [
          {
            path: '',
            component: CatalogHomeComponent,
          },
          {
            path: AdminRoutes.CATALOG_LAYER_DETAILS,
            component: GeoServiceLayerDetailsComponent,
          },
          {
            path: AdminRoutes.CATALOG_SERVICE_DETAILS,
            component: GeoServiceDetailsComponent,
          },
          {
            path: AdminRoutes.CATALOG_NODE_DETAILS,
            component: CatalogNodeDetailsComponent,
          },
          {
            path: AdminRoutes.FEATURE_SOURCE_DETAILS,
            component: FeatureSourceDetailsComponent,
          },
          {
            path: AdminRoutes.FEATURE_TYPE_DETAILS,
            component: FeatureTypeDetailsComponent,
            data: { className: 'full-screen-settings' },
          },
        ],
      },
      {
        path: AdminRoutes.APPLICATION,
        component: ApplicationPageComponent,
        data: { pageTitle: $localize `:@@admin-core.common.applications-title:Applications` },
        children: [
          {
            path: '',
            component: ApplicationHomeComponent,
          },
          {
            path: AdminRoutes.APPLICATION_CREATE,
            component: ApplicationCreateComponent,
          },
          {
            path: AdminRoutes.APPLICATION_DETAILS,
            component: ApplicationEditComponent,
            data: { className: 'full-screen-settings' },
            children: [
              {
                path: '',
                component: ApplicationEditSettingsComponent,
              },
              {
                path: AdminRoutes.APPLICATION_DETAILS_LAYERS,
                component: ApplicationEditLayersComponent,
              },
              {
                path: AdminRoutes.APPLICATION_DETAILS_BASE_LAYERS,
                component: ApplicationEditBaseLayersComponent,
              },
              {
                path: AdminRoutes.APPLICATION_DETAILS_COMPONENTS,
                component: ApplicationEditComponentsComponent,
              },
              {
                path: AdminRoutes.APPLICATION_DETAILS_STYLING,
                component: ApplicationEditStylingComponent,
              },
            ],
          },
        ],
      },
      {
        component: SettingsPageComponent,
        children: [{
          path: '',
          component: SettingsHomePageComponent,
        }],
        path: AdminRoutes.SETTINGS,
        data: { pageTitle: $localize `:@@admin-core.common.settings-title:Settings`, templateCls: 'content--no-padding' },
      },
      {
        component: FormPageComponent,
        children: [{
          path: '',
          component: FormHomeComponent,
        }, {
          path: AdminRoutes.FORMS_CREATE,
          component: FormCreateComponent,
        },
        {
          path: AdminRoutes.FORMS_DETAILS,
          component: FormEditComponent,
          data: { className: 'full-screen-settings' },
        }],
        path: AdminRoutes.FORMS,
        data: { pageTitle: $localize `:@@admin-core.common.forms-title:Forms` },
      },
      {
        component: SearchIndexPageComponent,
        children: [{
          path: '',
          component: SearchIndexHomeComponent,
        }, {
          path: AdminRoutes.SEARCH_INDEXES_CREATE,
          component: SearchIndexCreateComponent,
        },
        {
          path: AdminRoutes.SEARCH_INDEXES_DETAILS,
          component: SearchIndexEditComponent,
          data: { className: 'full-screen-settings' },
        }],
        path: AdminRoutes.SEARCH_INDEXES,
        data: { pageTitle: $localize `:@@admin-core.common.search-indexes-title:Search Indexes` },
      },
      {
        path: AdminRoutes.ADMIN_HOME,
        component: AdminHomePageComponent,
        data: { pageTitle: $localize `:@@admin-core.common.tailormap-admin-title:Tailormap Admin` },
      },
      {
        path: AdminRoutes.USER,
        component: UserAdminPageComponent,
        data: { pageTitle: $localize `:@@admin-core.common.users-title:User Administration` },
        children: [
          {
            path: '',
            component: UserHomeComponent,
          },
          {
            path: AdminRoutes.USER_CREATE,
            component: UserCreateComponent,
          },
          {
            path: AdminRoutes.USER_DETAILS,
            component: UserEditComponent,
          },
        ],
      },
      {
        path: AdminRoutes.GROUP,
        component: GroupsPageComponent,
        data: { pageTitle: $localize `:@@admin-core.common.groups-title:Group Administration` },
        children: [
          {
            path: '',
            component: GroupHomeComponent,
          },
          {
            path: AdminRoutes.GROUP_CREATE,
            component: GroupCreateComponent,
          },
          {
            path: AdminRoutes.GROUP_DETAILS,
            component: GroupEditComponent,
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forChild(adminRoutes)],
  exports: [RouterModule],
})
export class AdminCoreRoutingModule { }
