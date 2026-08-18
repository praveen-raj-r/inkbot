import sanitizeHtml from "sanitize-html";

// Matches what the Quill toolbar in components/post-editor-content.jsx
// actually produces (quillConfig.formats) — nothing more.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "blockquote",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "span",
  "img",
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  span: ["class", "style"],
  p: ["class", "style"],
  li: ["class"],
};

// Strips scripts, event handlers (onerror/onclick/...), javascript: links,
// and any tag/attribute Quill wouldn't have produced itself. Used both when
// a post is saved (convex/posts.js) and again at render time
// (the public post page) as defense in depth.
export function sanitizePostContent(html) {
  if (!html) return html;

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}
