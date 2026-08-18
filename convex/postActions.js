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
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.posts.updateInternal, {
      ...args,
      content:
        args.content !== undefined
          ? sanitizePostContent(args.content)
          : undefined,
    });
  },
});
