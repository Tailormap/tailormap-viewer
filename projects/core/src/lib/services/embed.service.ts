import { DestroyRef, Injectable } from '@angular/core';
import { BookmarkStringFragmentDescriptor } from '../bookmark/bookmark.models';
import { BookmarkService } from '../bookmark/bookmark.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class EmbedService {

  private static EMBED_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor('embed');
  private isEmbedded = false;

  constructor(
    private bookmarkService: BookmarkService,
    private destroyRef: DestroyRef,
  ) {
    this.bookmarkService.registerFragment$(EmbedService.EMBED_BOOKMARK_DESCRIPTOR)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(embedded => {
        this.isEmbedded = embedded === '1';
      });
  }

  public getEmbedLink() {
    return this.bookmarkService.getBookmark(EmbedService.EMBED_BOOKMARK_DESCRIPTOR, "1");
  }

  public isEmbeddedApplication() {
    return this.isEmbedded;
  }


}
