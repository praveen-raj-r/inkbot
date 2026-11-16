"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { sanitizePostContent } from "./lib/sanitize";

// Public, client-facing entry points for creating/updating a post. These
// run in the Node runtime — required because sanitizing rich-text HTML
// (sanitize-html -> postcss -> fs) isn't available in Convex's default
// mutation runtime — clean the content, then hand the actual write off to
// an internal mutation in convex/posts.js.

const MAX_TITLE = 200;
const MAX_CONTENT = 200000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;
const MAX_CATEGORY = 50;

function validatePost(args) {
  if (
    args.title !== undefined &&
    (!args.title.trim() || args.title.length > MAX_TITLE)
  )
    throw new Error(`Title must be 1-${MAX_TITLE} characters`);
  if (args.content !== undefined && args.content.length > MAX_CONTENT)
    throw new Error("Content is too long");
  if (args.tags !== undefined) {
    if (args.tags.length > MAX_TAGS)
      throw new Error(`At most ${MAX_TAGS} tags`);
    if (args.tags.some((t) => t.length > MAX_TAG_LENGTH))
      throw new Error(`Tags must be at most ${MAX_TAG_LENGTH} characters`);
  }
  if (args.scheduledFor !== undefined && args.scheduledFor < Date.now() - 60000)
    throw new Error("Scheduled time must be in the future");
  if (args.category !== undefined && args.category.length > MAX_CATEGORY)
    throw new Error("Category is too long");
  if (args.featuredImage) {
    let url;
    try {
      url = new URL(args.featuredImage);
    } catch {
      throw new Error("Invalid featured image URL");
    }
    if (url.protocol !== "https:" || url.hostname !== "ik.imagekit.io")
      throw new Error("Featured image must be uploaded through the editor");
  }
}

export const create = action({
  args: {
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validatePost(args);
    return await ctx.runMutation(internal.posts.createInternal, {
      ...args,
      content: sanitizePostContent(args.content),
    });
  },
});

export const update = action({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    clearSchedule: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    validatePost(args);
    return await ctx.runMutation(internal.posts.updateInternal, {
      ...args,
      content:
        args.content !== undefined
          ? sanitizePostContent(args.content)
          : undefined,
    });
  },
});
