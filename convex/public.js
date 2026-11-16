import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get published posts by username (for public profile)
export const getPublishedPostsByUsername = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // First get the user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", args.username.toLowerCase())
      )
      .unique();

    if (!user) {
      return { posts: [], hasMore: false };
    }

    // Get published posts by this user
    const limit = Math.min(args.limit || 10, 50);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_status", (q) =>
        q.eq("authorId", user._id).eq("status", "published")
      )
      .order("desc")
      .take(limit + 1);

    const hasMore = posts.length > limit;
    const finalPosts = hasMore ? posts.slice(0, limit) : posts;

    // Add author info to each post
    const postsWithAuthor = await Promise.all(
      finalPosts.map(async (post) => ({
        ...post,
        author: {
          _id: user._id,
          name: user.name,
          username: user.username,
          imageUrl: user.imageUrl,
        },
      }))
    );

    return {
      posts: postsWithAuthor,
      hasMore,
    };
  },
});

// Get a single published post by username and post ID
export const getPublishedPost = query({
  args: {
    username: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get the user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", args.username.toLowerCase())
      )
      .unique();

    if (!user) {
      return null;
    }

    // Get the post
    const post = await ctx.db.get(args.postId);

    if (!post) {
      return null;
    }

    // Verify the post belongs to this user and is published
    if (post.authorId !== user._id || post.status !== "published") {
      return null;
    }

    // Return post with author info
    return {
      ...post,
      author: {
        _id: user._id,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
      },
    };
  },
});

// Increment view count for a post
export const incrementViewCount = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);

    if (!post || post.status !== "published") {
      return;
    }

    // Update view count
    await ctx.db.patch(args.postId, {
      viewCount: post.viewCount + 1,
    });

    // Optional: Add daily stats tracking
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if we already have stats for today
    const existingStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_post_date", (q) =>
        q.eq("postId", args.postId).eq("date", today)
      )
      .unique();

    if (existingStats) {
      // Update existing stats
      await ctx.db.patch(existingStats._id, {
        views: existingStats.views + 1,
        updatedAt: Date.now(),
      });
    } else {
      // Create new daily stats entry
      await ctx.db.insert("dailyStats", {
        postId: args.postId,
        date: today,
        views: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
