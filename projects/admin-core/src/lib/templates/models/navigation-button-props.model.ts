import { Observable } from 'rxjs';

export interface NavigationButtonPropsModel {
  icon?: string;
  label: string;
  link: string[];
  subMenu?: NavigationButtonPropsModel[];
  matchExact: boolean;
  requireAdmin: boolean;
  checkEnabled$?: Observable<boolean>;
}
