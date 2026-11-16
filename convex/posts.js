import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrThrow } from "./lib/auth";

// Not reachable from the client directly — convex/postActions.js sanitizes
// `content` (which needs Node's fs via sanitize-html/postcss, so it has to
// run in a "use node" action) and then calls this to do the actual write.
export const createInternal = internalMutation({
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
    const user = await getCurrentUserOrThrow(ctx);

    // Check for existing draft
    const existingDraft = await ctx.db
      .query("posts")
      .withIndex("by_author_status", (q) =>
        q.eq("authorId", user._id).eq("status", "draft")
      )
      .first();

    const now = Date.now();

    // If publishing and we have an existing draft, update it to published
    if (args.status === "published" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        status: "published",
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        publishedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // If creating a draft and we have an existing draft, update it
    if (args.status === "draft" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // Create new post (either first draft or direct publish)
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      status: args.status,
      authorId: user._id,
      tags: args.tags || [],
      category: args.category,
      featuredImage: args.featuredImage,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
      scheduledFor: args.scheduledFor,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });

    return postId;
  },
});

// Not reachable from the client directly — see createInternal above.
export const updateInternal = internalMutation({
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
    const user = await getCurrentUserOrThrow(ctx);

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user owns the post
    if (post.authorId !== user._id) {
      throw new Error("Not authorized to update this post");
    }

    const now = Date.now();
    const updateData = {
      updatedAt: now,
    };

    // Add provided fields to update
    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.featuredImage !== undefined)
      updateData.featuredImage = args.featuredImage;
    if (args.scheduledFor !== undefined)
      updateData.scheduledFor = args.scheduledFor;

    // Handle status change
    if (args.status !== undefined) {
      updateData.status = args.status;

      // If publishing for the first time
      if (args.status === "published" && post.status === "draft") {
        updateData.publishedAt = now;
      }
    }

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Get user's draft (there should only be one)
export const getUserDraft = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const draft = await ctx.db
      .query("posts")
      .withIndex("by_author_status", (q) =>
        q.eq("authorId", user._id).eq("status", "draft")
      )
      .first();

    return draft;
  },
});

// Get user's posts
export const getUserPosts = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_status", (q) => {
        const byAuthor = q.eq("authorId", user._id);
        return args.status ? byAuthor.eq("status", args.status) : byAuthor;
      })
      .order("desc")
      .collect();

    // Add username to each post
    return posts.map((post) => ({
      ...post,
      username: user.username,
    }));
  },
});

// Get a single post by ID
export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;

    // Drafts (and anything unpublished) are only visible to their author.
    const user = await getCurrentUser(ctx);
    if (!user || post.authorId !== user._id) return null;

    return post;
  },
});

// Delete a post
export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user owns the post
    if (post.authorId !== user._id) {
      throw new Error("Not authorized to delete this post");
    }

    // Remove everything that hangs off the post so nothing is orphaned.
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);

    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();
    for (const d of stats) await ctx.db.delete(d._id);

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
