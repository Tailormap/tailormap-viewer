import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, EventEmitter, Injector, Input, linkedSignal, OnInit,
  Output, untracked, viewChild, ViewEncapsulation, inject, input,
} from '@angular/core';
import { TemplatePicklistConfig } from './template-picklist.model';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MarkdownEditorService } from './markdown-editor.service';
import { skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MilkdownEditorComponent } from './milkdown/milkdown-editor.component';
import { MarkdownSourceEditorComponent } from './markdown-source-editor/markdown-source-editor.component';
import { MarkdownEditorInsertUploadFn, MarkdownEditorResolveImageUrlFn, MarkdownEditorUploadFn } from './markdown-editor-upload.model';

const LOCALSTORAGE_EDITOR_KEY = 'tm-markdown-editor-pick';

/** Which editor is shown: the visual (Milkdown/Crepe) editor or the Markdown source with a preview. */
export type MarkdownEditorMode = 'milkdown' | 'source';

/**
 * How the editor looks.
 * - `default`: a header to switch between the visual and source editor, the editor has a border.
 * - `inline`: no header, border or background; the visual editor takes font, color and line height from its parent, so
 *   it looks like the surrounding page text. Formatting is done with Crepe's floating toolbar shown on a text selection.
 */
export type MarkdownEditorAppearance = 'default' | 'inline';

@Component({
  selector: 'tm-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ MilkdownEditorComponent, MarkdownSourceEditorComponent, MatFormField, MatLabel, MatSelect, MatOption, MatButtonToggleGroup, MatButtonToggle ],
  providers: [MarkdownEditorService],
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.tm-markdown-editor--inline]': 'isInline()',
  },
})
export class MarkdownEditorComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private mdEditorService = inject(MarkdownEditorService);
  private injector = inject(Injector);

  private _content: string | undefined;

  @Input()
  public set content(content: string | undefined) {
    this._content = content;
    this.mdEditorService.resetContent(this._content ?? '');
  }
  public get content() {
    return this._content;
  }

  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  @Input()
  public uploadService$?: MarkdownEditorUploadFn;

  /**
   * When set, the visual editor's built-in image item in the slash menu is replaced by an item which calls this
   * function to pick an upload and inserts the returned Markdown.
   */
  public insertUpload$ = input<MarkdownEditorInsertUploadFn>();

  /**
   * When set, used by the visual editor and the source editor preview to get the URL to display an image.
   */
  public resolveImageUrl = input<MarkdownEditorResolveImageUrlFn>();

  @Input()
  public useInfoPanelWidth = false;

  /** Shown while the content is empty, e.g. to say what to write. */
  public placeholder = input<string>();

  /** How the editor looks, see {@link MarkdownEditorAppearance}. */
  public appearance = input<MarkdownEditorAppearance>('default');

  /**
   * Shows the visual or the source editor. When not set, the last choice made with the header toggle (stored in local
   * storage) is used. Changing it overrides a choice made with the header toggle.
   */
  public mode = input<MarkdownEditorMode>();

  @Output()
  public contentChanged = new EventEmitter<string>();

  public selectedEditor = linkedSignal<MarkdownEditorMode>(() => this.mode() ?? MarkdownEditorComponent.getStoredMode());
  public isMilkdownEditor = computed(() => this.selectedEditor() === 'milkdown');
  public isSourceEditor = computed(() => this.selectedEditor() === 'source');
  public isInline = computed(() => this.appearance() === 'inline');

  private milkdownEditor = viewChild(MilkdownEditorComponent);
  private sourceEditor = viewChild(MarkdownSourceEditorComponent);

  constructor() {
    // When the mode is switched from outside, make the service content match the latest edits before the other editor
    // is created (same as toggleEditor), otherwise the source editor would show the content from before the edits.
    // Component effects run before this component's template is refreshed, so before the other editor is created.
    effect(() => {
      this.mode();
      untracked(() => this.mdEditorService.resetContent(this.mdEditorService.getCurrentContent()));
    });
  }

  private static getStoredMode(): MarkdownEditorMode {
    return window.localStorage.getItem(LOCALSTORAGE_EDITOR_KEY) === 'source' ? 'source' : 'milkdown';
  }

  public ngOnInit() {
    this.mdEditorService.resetContent(this.content ?? "");
    this.mdEditorService.getUpdatedContent$()
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(content => {
        this.contentChanged.emit(content);
      });
  }

  public insertVariable(value: string) {
    this.mdEditorService.insertVariable(value);
  }

  /**
   * Moves keyboard focus into the editor that is shown. When the editor is not rendered yet (e.g. right after
   * changing `mode`), it is focused after the next render; the visual editor is focused once Milkdown has loaded.
   */
  public focus() {
    if (this.focusEditor()) {
      return;
    }
    afterNextRender(() => this.focusEditor(), { injector: this.injector });
  }

  private focusEditor(): boolean {
    const editor = this.isSourceEditor() ? this.sourceEditor() : this.milkdownEditor();
    editor?.focus();
    return !!editor;
  }

  public toggleEditor(editor: MarkdownEditorMode) {
    this.selectedEditor.set(editor);
    this.mdEditorService.resetContent(this.mdEditorService.getCurrentContent());
    window.localStorage.setItem(LOCALSTORAGE_EDITOR_KEY, editor);
  }

}
