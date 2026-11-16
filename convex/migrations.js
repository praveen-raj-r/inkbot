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

// Usernames are now stored lowercase. Run once after deploying:
//   npx convex run migrations:lowercaseUsernames
// Returns any usernames that collide once lowercased (left unchanged).
export const lowercaseUsernames = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const taken = new Set(
      users.map((u) => u.username).filter((n) => n && n === n.toLowerCase())
    );
    const collisions = [];

    for (const user of users) {
      if (!user.username || user.username === user.username.toLowerCase())
        continue;
      const lower = user.username.toLowerCase();
      if (taken.has(lower)) {
        collisions.push(user.username);
        continue;
      }
      taken.add(lower);
      await ctx.db.patch(user._id, { username: lower });
    }
    return { collisions };
  },
});
