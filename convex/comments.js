import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrThrow } from "./lib/auth";

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be logged in to comment");
    }

    const post = await ctx.db.get(args.postId);

    if (!post || post.status !== "published") {
      throw new Error("Post not found or not published");
    }

    // Validate content
    if (!args.content.trim() || args.content.length > 1000) {
      throw new Error("Comment must be between 1-1000 characters");
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      authorName: user.name,
      authorEmail: user.email,
      content: args.content.trim(),
      status: "approved", // Auto-approve since only authenticated users can comment
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, {
      commentCount: (post.commentCount || 0) + 1,
    });

    return commentId;
  },
});

// Get comments for a post
export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_status", (q) =>
        q.eq("postId", args.postId).eq("status", "approved")
      )
      .order("asc")
      .collect();

    // Add user info for all comments (since all are from authenticated users)
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return commentsWithUsers.filter((comment) => comment.author !== null);
  },
});

// Delete a comment (only by author or post owner)
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Get the post to check if user is the post owner
    const post = await ctx.db.get(comment.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user can delete this comment (comment author or post owner)
    const canDelete =
      comment.authorId === user._id || post.authorId === user._id;

    if (!canDelete) {
      throw new Error("Not authorized to delete this comment");
    }

    await ctx.db.delete(args.commentId);

    if (comment.status === "approved") {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, (post.commentCount || 0) - 1),
      });
    }

    return { success: true };
  },
});
