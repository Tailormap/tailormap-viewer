import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectViewerLogo } from '../../../state/core.selectors';
import { distinctUntilChanged, Observable, of } from 'rxjs';
import { ImageWithDescriptionComponent } from '../../../shared/components/image-with-description/image-with-description.component';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-menubar-logo',
    templateUrl: './menubar-logo.component.html',
    styleUrls: ['./menubar-logo.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ImageWithDescriptionComponent,
        MatIcon,
        AsyncPipe,
    ],
})
export class MenubarLogoComponent implements OnInit {
  private store$ = inject(Store);


  public logo$: Observable<string | null> = of(null);

  public ngOnInit(): void {
    this.logo$ = this.store$.select(selectViewerLogo).pipe(distinctUntilChanged());
  }

}
