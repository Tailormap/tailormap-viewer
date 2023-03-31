import { ApplicationState, applicationStateKey } from './application.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

const selectApplicationState = createFeatureSelector<ApplicationState>(applicationStateKey);

export const selectApplications = createSelector(selectApplicationState, state => state.applications);
export const selectApplicationsLoadStatus = createSelector(selectApplicationState, state => state.applicationsLoadStatus);
export const selectApplicationsLoadError = createSelector(selectApplicationState, state => state.applicationsLoadError);
export const selectApplicationListFilter = createSelector(selectApplicationState, state => state.applicationListFilter);

export const selectApplicationList = createSelector(
  selectApplications,
  selectApplicationListFilter,
  (applications, filter) => {
    if (!filter) {
      return applications;
    }
    const filterRegexes: RegExp[] = filter.trim().split(' ').map(f => new RegExp(f, 'i'));
    return applications
      .filter(application => {
        const searchableContent = [ application.name, application.title ].join(' ');
        return filterRegexes.every(f => f.test(searchableContent));
      });
  },
);

export const selectApplicationById = (id: string) => createSelector(
  selectApplications,
  applications => applications.find(a => a.id === id) || null,
);
