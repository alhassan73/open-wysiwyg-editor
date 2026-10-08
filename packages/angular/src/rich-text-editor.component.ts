import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
  afterNextRender,
  booleanAttribute,
  forwardRef,
  inject,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms";
import {
  createEditor,
  forwardCallbacks,
  syncContent,
  type Content,
  type Editor,
  type EditorOptions,
} from "open-wysiwyg-editor";

export type RichTextEditorOptions = Omit<EditorOptions, "element">;

/**
 * The full editor (toolbar, dialogs, status bar) as a standalone component.
 *
 * ```html
 * <owe-rich-text-editor [(ngModel)]="html" placeholder="Write…" />
 * <owe-rich-text-editor formControlName="body" />
 * <owe-rich-text-editor [(value)]="html" [options]="{ language: 'ar' }" />
 * ```
 *
 * The editor starts in `afterNextRender`, so it never runs during server-side rendering, and its
 * DOM listeners run outside the Angular zone.
 */
@Component({
  selector: "owe-rich-text-editor",
  standalone: true,
  template: "<div #host></div>",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true },
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor, OnChanges, OnDestroy {
  /** The content as HTML. Use `[(value)]`, or `ngModel` / reactive forms. */
  @Input() value: string | undefined;
  /** Everything else `createEditor()` accepts. Read once, when the editor starts. */
  @Input() options: RichTextEditorOptions = {};
  @Input() placeholder: string | undefined;
  @Input({ transform: booleanAttribute }) readonly = false;

  @Output() readonly valueChange = new EventEmitter<string>();
  /** Emits the editor instance once it has started. */
  @Output() readonly ready = new EventEmitter<Editor>();

  @ViewChild("host", { static: true }) private host!: ElementRef<HTMLElement>;

  /** The live editor, or `null` before it starts (and on the server). */
  editor: Editor | null = null;

  private readonly zone = inject(NgZone);
  private applied: Content = undefined;
  private disabled = false;
  private onChange: (html: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => this.start());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["value"]) this.load(this.value);
    if (changes["placeholder"] || changes["readonly"]) this.applyRuntime();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }

  // ---- ControlValueAccessor ------------------------------------------------------------------
  writeValue(html: string | null): void {
    this.value = html ?? "";
    this.load(this.value);
  }
  registerOnChange(fn: (html: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.applyRuntime();
  }

  // ---- internals -----------------------------------------------------------------------------
  private start(): void {
    const options = this.options;
    this.applied = this.value ?? options.content;
    this.editor = this.zone.runOutsideAngular(() =>
      createEditor({
        ...options,
        ...this.runtime(),
        element: this.host.nativeElement,
        content: this.applied,
        ...forwardCallbacks(() => this.options),
        onUpdate: (editor) => {
          const html = editor.getHTML();
          this.applied = html;
          this.options.onUpdate?.(editor);
          this.zone.run(() => {
            this.value = html;
            this.onChange(html);
            this.valueChange.emit(html);
          });
        },
        onBlur: (editor, event) => {
          this.options.onBlur?.(editor, event);
          this.zone.run(() => this.onTouched());
        },
      }),
    );
    this.ready.emit(this.editor);
  }

  private load(html: string | undefined): void {
    if (!this.editor || html === undefined || html === this.applied) return;
    this.applied = html;
    syncContent(this.editor, html);
  }

  private runtime(): Partial<EditorOptions> {
    return {
      editable: !this.readonly && !this.disabled && this.options.editable !== false,
      placeholder: this.placeholder ?? this.options.placeholder,
    };
  }

  private applyRuntime(): void {
    this.editor?.setOptions(this.runtime());
  }
}
