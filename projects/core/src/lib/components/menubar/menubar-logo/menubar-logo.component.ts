import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectViewerLogo } from '../../../state/core.selectors';
import { distinctUntilChanged, Observable, of } from 'rxjs';

@Component({
  selector: 'tm-menubar-logo',
  templateUrl: './menubar-logo.component.html',
  styleUrls: ['./menubar-logo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MenubarLogoComponent implements OnInit {
  private store$ = inject(Store);


  public logo$: Observable<string | null> = of(null);

  public ngOnInit(): void {
    this.logo$ = this.store$.select(selectViewerLogo).pipe(distinctUntilChanged());
  }

}
