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
    {
      label: $localize `Geo Registry`, matchExact: false, link: RoutesEnum.GEO_REGISTRY, icon: 'admin_geo_registry', subMenu: [
        { label: $localize `Services`, matchExact: true, link: RoutesEnum.GEO_REGISTRY },
        { label: $localize `Sources`, matchExact: true, link: RoutesEnum.GEO_REGISTRY_SOURCES },
        { label: $localize `Attributes`, matchExact: true, link: RoutesEnum.GEO_REGISTRY_ATTRIBUTES },
      ],
    },
  ];

  constructor() { }

  public ngOnInit(): void {
  }

  public getButtonProps(button: ButtonProps): ButtonProps {
    return button as ButtonProps;
  }

}
