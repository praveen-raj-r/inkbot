import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrThrow } from "./lib/auth";

// Get dashboard analytics for the authenticated user
export const getAnalytics = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Get all user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    // Get user's followers count
    const followersCount = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    // Calculate analytics
    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0);
    const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
    const totalComments = posts.reduce(
      (sum, post) => sum + (post.commentCount || 0),
      0
    );

    // Calculate growth percentages (simplified - you might want to implement proper date-based calculations)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const dateKey = (ms) => new Date(ms).toISOString().split("T")[0];
    const cutoff30 = dateKey(thirtyDaysAgo);
    const cutoff60 = dateKey(sixtyDaysAgo);

    // Views: last 30 days vs the 30 days before, from daily stats.
    let viewsNow = 0;
    let viewsPrev = 0;
    // Likes: same windows, from each like createdAt.
    let likesNow = 0;
    let likesPrev = 0;

    await Promise.all(
      posts.map(async (post) => {
        const [stats, likes] = await Promise.all([
          ctx.db
            .query("dailyStats")
            .withIndex("by_post_date", (q) =>
              q.eq("postId", post._id).gte("date", cutoff60)
            )
            .collect(),
          ctx.db
            .query("likes")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .collect(),
        ]);
        for (const s of stats) {
          if (s.date >= cutoff30) viewsNow += s.views;
          else viewsPrev += s.views;
        }
        for (const l of likes) {
          if (l.createdAt >= thirtyDaysAgo) likesNow++;
          else if (l.createdAt >= sixtyDaysAgo) likesPrev++;
        }
      })
    );

    // Percent change vs the previous 30 days. With no previous activity,
    // any new activity counts as +100%; a drop shows as 0 (badge hidden).
    const pctChange = (now, prev) =>
      prev > 0 ? ((now - prev) / prev) * 100 : now > 0 ? 100 : 0;
    const viewsGrowth = Math.max(0, pctChange(viewsNow, viewsPrev));
    const likesGrowth = Math.max(0, pctChange(likesNow, likesPrev));
    // No per-comment history is aggregated here, so don't invent a number.
    const commentsGrowth = 0;
    // Followers gained in the last 30 days as a share of all followers.
    const recentFollowers = followersCount.filter(
      (f) => f.createdAt > thirtyDaysAgo
    ).length;
    const followersGrowth =
      followersCount.length > 0
        ? (recentFollowers / followersCount.length) * 100
        : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalFollowers: followersCount.length,
      viewsGrowth: Math.round(viewsGrowth * 10) / 10,
      likesGrowth: Math.round(likesGrowth * 10) / 10,
      commentsGrowth,
      followersGrowth: Math.round(followersGrowth * 10) / 10,
    };
  },
});

// Get recent activity for the dashboard
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const postIds = posts.map((p) => p._id);
    const activities = [];

    // Get recent likes on user's posts
    for (const postId of postIds) {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .order("desc")
        .take(5);

      for (const like of likes) {
        if (like.userId) {
          const likeUser = await ctx.db.get(like.userId);
          const post = posts.find((p) => p._id === postId);

          if (likeUser && post) {
            activities.push({
              type: "like",
              user: likeUser.name,
              post: post.title,
              time: like.createdAt,
            });
          }
        }
      }
    }

    // Get recent comments on user's posts
    for (const postId of postIds) {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post_status", (q) =>
          q.eq("postId", postId).eq("status", "approved")
        )
        .order("desc")
        .take(5);

      for (const comment of comments) {
        const post = posts.find((p) => p._id === postId);

        if (post) {
          activities.push({
            type: "comment",
            user: comment.authorName,
            post: post.title,
            time: comment.createdAt,
          });
        }
      }
    }

    // Get recent followers
    const recentFollowers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .order("desc")
      .take(5);

    for (const follow of recentFollowers) {
      const follower = await ctx.db.get(follow.followerId);
      if (follower) {
        activities.push({
          type: "follow",
          user: follower.name,
          time: follow.createdAt,
        });
      }
    }

    // Sort all activities by time and limit
    activities.sort((a, b) => b.time - a.time);

    return activities.slice(0, args.limit || 10);
  },
});

// Get posts with analytics for dashboard
export const getPostsWithAnalytics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // commentCount lives on the post document itself, so no per-post
    // comment query is needed here.
    return await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(args.limit || 5);
  },
});

// Get daily views data for chart (last 30 days) - Assignment
export const getDailyViews = query({
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Get user's posts
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const postIds = userPosts.map((post) => post._id);

    // Generate last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      days.push({
        date: dateString,
        views: 0,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }

    // Get daily stats for all user's posts
    const dailyStats = (
      await Promise.all(
        postIds.map((id) =>
          ctx.db
            .query("dailyStats")
            .withIndex("by_post", (q) => q.eq("postId", id))
            .collect()
        )
      )
    ).flat();

    // Aggregate views by date
    const viewsByDate = {};
    dailyStats.forEach((stat) => {
      if (viewsByDate[stat.date]) {
        viewsByDate[stat.date] += stat.views;
      } else {
        viewsByDate[stat.date] = stat.views;
      }
    });

    // Merge with days array
    const chartData = days.map((day) => ({
      ...day,
      views: viewsByDate[day.date] || 0,
    }));

    return chartData;
  },
});
