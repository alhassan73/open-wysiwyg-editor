<p align="center"><a href="https://alhassan73.github.io/open-wysiwyg-editor/"><img src="https://raw.githubusercontent.com/alhassan73/open-wysiwyg-editor/main/.github/assets/banner.png" alt="Open WYSIWYG Editor — accessible, RTL-first rich text editor for every framework" width="100%"></a></p>

# @open-wysiwyg-editor/angular

[![npm version](https://img.shields.io/npm/v/@open-wysiwyg-editor/angular)](https://www.npmjs.com/package/@open-wysiwyg-editor/angular)
[![license](https://img.shields.io/npm/l/@open-wysiwyg-editor/angular)](https://github.com/alhassan73/open-wysiwyg-editor/blob/main/LICENSE)

**[Live demo →](https://alhassan73.github.io/open-wysiwyg-editor/)** · [GitHub](https://github.com/alhassan73/open-wysiwyg-editor) · [npm](https://www.npmjs.com/package/@open-wysiwyg-editor/angular)

Angular component for [open-wysiwyg-editor](https://github.com/alhassan73/open-wysiwyg-editor#readme): an accessible (WCAG 2.2 AA), RTL-first, CSP-safe rich text editor. It is a standalone component that works with `[(ngModel)]`, reactive forms, signals and Angular SSR.

Requires **Angular 21+**.

## Install

```bash
npm install @open-wysiwyg-editor/angular
```

This also installs the core package `open-wysiwyg-editor`. The package re-exports the whole core API (`createEditor`, `StarterKit`, types…), so you don't need to import from the core package yourself.

## Setup

Add the stylesheet to `angular.json`:

```json
"styles": [
  "node_modules/@open-wysiwyg-editor/angular/style.css",
  "src/styles.css"
]
```

Or import it in your global `styles.css`:

```css
@import "@open-wysiwyg-editor/angular/style.css";
```

`style.css` styles the toolbar and the editor. If you render saved HTML outside the editor, add `content.css` (the same content styles) to that page. Minified `style.min.css` and `content.min.css` are included.

## Usage

### Standalone component with `[(ngModel)]`

```ts
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RichTextEditorComponent } from "@open-wysiwyg-editor/angular";

@Component({
  selector: "app-post",
  imports: [FormsModule, RichTextEditorComponent],
  template: `
    <owe-rich-text-editor [(ngModel)]="html" placeholder="Write something…" />
    <pre>{{ html }}</pre>
  `,
})
export class PostComponent {
  html = "<p>Hello <strong>world</strong></p>";
}
```

### Reactive forms

```ts
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RichTextEditorComponent } from "@open-wysiwyg-editor/angular";

@Component({
  selector: "app-compose",
  imports: [ReactiveFormsModule, RichTextEditorComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <owe-rich-text-editor formControlName="body" />
      @if (form.controls.body.touched && form.controls.body.errors) {
        <p role="alert">Write something first.</p>
      }
      <button>Save</button>
    </form>
  `,
})
export class ComposeComponent {
  form = inject(FormBuilder).nonNullable.group({
    body: ["", [Validators.required, Validators.minLength(10)]],
  });

  save() {
    console.log(this.form.getRawValue().body);
  }
}
```

The control is marked touched when the editor loses focus. `form.controls.body.disable()` makes the editor read-only.

### Without forms: `[(value)]`

```html
<owe-rich-text-editor [(value)]="html" />
```

### Signals

`value` is a regular input and `valueChange` is a regular output, so `[(value)]` works with a `model()` or `signal()`:

```ts
import { Component, signal } from "@angular/core";
import { RichTextEditorComponent } from "@open-wysiwyg-editor/angular";

@Component({
  selector: "app-note",
  imports: [RichTextEditorComponent],
  template: `
    <owe-rich-text-editor [(value)]="html" />
    <p>{{ html().length }} characters of HTML</p>
  `,
})
export class NoteComponent {
  html = signal("<p>Start here</p>");
}
```

### Options

`[options]` takes anything `createEditor()` accepts, except `element`. It is read **once, when the editor starts**. `placeholder` and `readonly` follow changes.

```html
<owe-rich-text-editor
  [(ngModel)]="html"
  [options]="{ language: 'ar', dir: 'rtl', autofocus: true }"
  placeholder="اكتب هنا…"
/>
```

See the [core docs](https://github.com/alhassan73/open-wysiwyg-editor#readme) for all options (extensions, labels, languages, URL policy, input rules…).

### Get the editor: `(ready)`

```ts
import type { Editor } from "@open-wysiwyg-editor/angular";

onReady(editor: Editor) {
  editor.focus();
  console.log(editor.getJSON());
}
```

```html
<owe-rich-text-editor [(ngModel)]="html" (ready)="onReady($event)" />
```

You can also read it with a `viewChild`: `editor()?.editor` is `null` until the editor has started.

### Read-only and disabled

```html
<owe-rich-text-editor [value]="html" readonly />
```

With forms, `FormControl.disable()` or `[disabled]` on the control does the same.

### Server-side rendering

Nothing to configure. The editor starts in `afterNextRender`, so it never runs on the server, and it works with Angular SSR and hydration. The server renders an empty container, and the editor mounts in the browser. Its DOM listeners run outside the Angular zone, so typing doesn't trigger change detection except when the value changes.

## API

### Inputs

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | `undefined` | HTML content. Two-way with `[(value)]`. |
| `options` | `RichTextEditorOptions` | `{}` | `createEditor()` options without `element`. Read once at start. |
| `placeholder` | `string` | `undefined` | Overrides `options.placeholder`. Updates live. |
| `readonly` | `boolean` | `false` | Disables editing. Updates live. |

### Outputs

| Output | Payload | Notes |
| --- | --- | --- |
| `valueChange` | `string` | The HTML after every change. |
| `ready` | `Editor` | Emitted once, in the browser, after the editor starts. |

### Members

| Member | Notes |
| --- | --- |
| `editor` | The live `Editor`, or `null` before it starts (and on the server). |

Forms: implements `ControlValueAccessor` (value, disabled state, touched on blur).

## Alternative: the `<owe-editor>` web component

The core package also ships a form-associated custom element. Use it if you prefer no Angular wrapper. Angular binds it with `ngDefaultControl`.

```ts
// main.ts
import "open-wysiwyg-editor/element";
```

```ts
import { CUSTOM_ELEMENTS_SCHEMA, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-post",
  imports: [FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<owe-editor ngDefaultControl [(ngModel)]="html" language="ar"></owe-editor>`,
})
export class PostComponent {
  html = "";
}
```

You still need `style.css` from the setup above. See the core docs for the element's attributes and events.

## Links

- [Core docs and options](https://github.com/alhassan73/open-wysiwyg-editor#readme)
- [Live demo and website](https://alhassan73.github.io/open-wysiwyg-editor/)
- [Report an issue](https://github.com/alhassan73/open-wysiwyg-editor/issues)

## License

MIT © alhassan-ahmed
