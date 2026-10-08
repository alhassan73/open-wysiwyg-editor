// Next.js package. The build marks it "use client", so pages and layouts (Server Components) can
// render <RichTextEditor> directly. It renders an empty container and the hidden form field on the
// server; the editor itself starts in the browser.
//
//   <form action={saveArticle}>
//     <RichTextEditor name="body" defaultValue={article.body} />
//   </form>
//
// Everything comes from the React package, so the two always match.
export * from "@open-wysiwyg-editor/react";
