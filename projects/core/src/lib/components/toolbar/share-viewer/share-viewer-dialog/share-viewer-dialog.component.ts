import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { BookmarkService } from '../../../../services/bookmark/bookmark.service';
import { MatDialogRef, MatDialogTitle, MatDialogActions } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationBookmarkFragments } from '../../../../services/application-bookmark/application-bookmark-fragments';
import { startWith } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'tm-share-viewer-dialog',
    templateUrl: './share-viewer-dialog.component.html',
    styleUrls: ['./share-viewer-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatDialogTitle,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        MatDialogActions,
        MatButton,
    ],
})
export class ShareViewerDialogComponent implements OnInit {
  private bookmarkService = inject(BookmarkService);
  private dialogRef = inject<MatDialogRef<ShareViewerDialogComponent>>(MatDialogRef);
  private destroyRef = inject(DestroyRef);


  public urlControl = new FormControl<string>('');
  public embedControl = new FormControl<string>('');

  public ngOnInit() {

    this.bookmarkService.getBookmarkValue$()
      .pipe(
        startWith(''),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(bookmark => {
        const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        this.urlControl.patchValue(`${baseUrl}#${bookmark || ''}`);
        this.embedControl.patchValue(`${baseUrl}#${this.getEmbedLink()}`);
      });
  }

  private getEmbedLink() {
    return this.bookmarkService.getBookmark(ApplicationBookmarkFragments.EMBED_BOOKMARK_DESCRIPTOR, '1');
  }

  public closeDialog() {
    this.dialogRef.close();
  }

  public selectInput($event: MouseEvent) {
    const target = $event.target;
    if (target instanceof HTMLInputElement) {
      target.select();
    }
  }

}
