import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectViewerLogo } from '../../../state/core.selectors';
import { distinctUntilChanged, Observable, of } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'tm-menubar-logo',
  templateUrl: './menubar-logo.component.html',
  styleUrls: ['./menubar-logo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenubarLogoComponent implements OnInit {

  public logo$: Observable<string | null> = of(null);

  constructor(
    private store$: Store,
    private sanitizer: DomSanitizer,
  ) { }

  public ngOnInit(): void {
    this.logo$ = this.store$.select(selectViewerLogo).pipe(distinctUntilChanged());
  }

  public getSafeUrl(url: string): SafeUrl | string {
    if (url.startsWith('data:')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    return url;
  }

}
