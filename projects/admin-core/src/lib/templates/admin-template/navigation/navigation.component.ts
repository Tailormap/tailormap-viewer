import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RoutesEnum } from '../../../routes';
import { Store } from '@ngrx/store';
import { selectUserDetails } from '../../../state/admin-core.selectors';
import { map, Observable, of } from 'rxjs';

interface ButtonProps {
  icon?: string;
  label: string;
  link: string;
  subMenu?: ButtonProps[];
  matchExact: boolean;
  requireAdmin: boolean;
}

const availableButtons: ButtonProps[] = [
  { label: $localize `Home`, matchExact: true, link: RoutesEnum.ADMIN_HOME, icon: 'admin_home', requireAdmin: false },
  { label: $localize `Catalog`, matchExact: false, link: RoutesEnum.CATALOG, icon: 'admin_catalog', requireAdmin: true },
  { label: $localize `Users`, matchExact: true, link: RoutesEnum.USER, icon: 'admin_user', requireAdmin: true },
  { label: $localize `Groups`, matchExact: true, link: RoutesEnum.GROUP, icon: 'admin_groups', requireAdmin: true },
  { label: $localize `Applications`, matchExact: false, link: RoutesEnum.APPLICATION, icon: 'admin_application', requireAdmin: true },
];

@Component({
  selector: 'tm-admin-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit {

  public buttons$: Observable<ButtonProps[]> = of([]);

  constructor(
    private store$: Store,
  ) {}

  public ngOnInit(): void {
    this.buttons$ = this.store$.select(selectUserDetails)
      .pipe(
        map(userDetails => {
          const isAdmin = userDetails?.roles?.includes('admin') ?? false;
          return availableButtons.filter(button => isAdmin || !button.requireAdmin);
        }),
      );
  }

  public getButtonProps(button: ButtonProps): ButtonProps {
    return button as ButtonProps;
  }

}
