import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RoutesEnum } from '../../../routes';

interface ButtonProps {
  icon?: string;
  label: string;
  link: string;
  subMenu?: ButtonProps[];
  matchExact: boolean;
}

@Component({
  selector: 'tm-admin-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit {

  public buttons: ButtonProps[] = [
    { label: $localize `Home`, matchExact: true, link: RoutesEnum.ADMIN_HOME, icon: 'admin_home' },
    { label: $localize `Catalog`, matchExact: false, link: RoutesEnum.CATALOG, icon: 'admin_catalog' },
    { label: $localize `Users`, matchExact: true, link: RoutesEnum.USER, icon: 'admin_user' },
    { label: $localize `Groups`, matchExact: true, link: RoutesEnum.GROUP, icon: 'admin_groups' },
    { label: $localize `Applications`, matchExact: false, link: RoutesEnum.APPLICATION, icon: 'admin_application' },
  ];

  constructor() { }

  public ngOnInit(): void {
  }

  public getButtonProps(button: ButtonProps): ButtonProps {
    return button as ButtonProps;
  }

}
