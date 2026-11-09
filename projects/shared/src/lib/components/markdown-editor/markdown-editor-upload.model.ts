import { Observable } from 'rxjs';

/**
 * Opens a picker for an upload (image or file) and returns the Markdown to insert in the editor, for example
 * `![label](url)` or `[label](url)`. Returns null when the picker was cancelled.
 */
export type MarkdownEditorInsertUploadFn = () => Observable<string | null>;


/**
 * Uploads a file which was pasted or dropped in the editor. Returns the URL to use in the Markdown or an error.
 */
export type MarkdownEditorUploadFn = (file: File) => Observable<{ error?: string; url?: string } | null>;
