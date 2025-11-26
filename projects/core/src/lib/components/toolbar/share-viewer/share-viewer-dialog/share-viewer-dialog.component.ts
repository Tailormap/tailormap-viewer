import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { BookmarkService } from '../../../../services/bookmark/bookmark.service';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationBookmarkFragments } from '../../../../services/application-bookmark/application-bookmark-fragments';
import { startWith } from 'rxjs';

@Component({
  selector: 'tm-share-viewer-dialog',
  templateUrl: './share-viewer-dialog.component.html',
  styleUrls: ['./share-viewer-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
