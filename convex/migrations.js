import { internalMutation } from "./_generated/server";

// One-time backfill for posts created before `commentCount` existed on
// the schema. Safe to run more than once. Run it from the Convex
// dashboard's function runner, or:
//   npx convex run migrations:backfillCommentCounts
export const backfillCommentCounts = internalMutation({
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();

    for (const post of posts) {
      if (post.commentCount !== undefined) continue;

      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post_status", (q) =>
          q.eq("postId", post._id).eq("status", "approved")
        )
        .collect();

      await ctx.db.patch(post._id, { commentCount: comments.length });
    }

    return { postsChecked: posts.length };
  },
});
