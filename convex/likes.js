import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, getCurrentUser } from "./lib/auth";

// Toggle like on a post
export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Identity always comes from auth, never from the client.
    const user = await getCurrentUserOrThrow(ctx);
    const userId = user._id;

    const post = await ctx.db.get(args.postId);

    if (!post || post.status !== "published") {
      throw new Error("Post not found or not published");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", args.postId).eq("userId", userId)
      )
      .unique();

    if (existingLike) {
      // Unlike - remove the like
      await ctx.db.delete(existingLike._id);

      // Decrement like count
      await ctx.db.patch(args.postId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });

      return { liked: false, likeCount: Math.max(0, post.likeCount - 1) };
    } else {
      // Like - add the like
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: userId,
        createdAt: Date.now(),
      });

      // Increment like count
      await ctx.db.patch(args.postId, {
        likeCount: post.likeCount + 1,
      });

      return { liked: true, likeCount: post.likeCount + 1 };
    }
  },
});

// Check if user has liked a post
export const hasUserLiked = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return false;
    }

    const like = await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", args.postId).eq("userId", user._id)
      )
      .unique();

    return !!like;
  },
});
