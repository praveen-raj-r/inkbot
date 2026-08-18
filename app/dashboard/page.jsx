"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Eye,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { formatDistanceToNow } from "date-fns";
import DailyViewsChart from "@/components/daily-views-chart";
import LoadingState from "@/components/loading-state";
import EmptyState from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  // Fetch real data
  const { data: analytics, isLoading: analyticsLoading } = useConvexQuery(
    api.dashboard.getAnalytics,
  );
  const { data: recentPosts, isLoading: postsLoading } = useConvexQuery(
    api.dashboard.getPostsWithAnalytics,
    { limit: 5 },
  );
  const { data: recentActivity, isLoading: activityLoading } = useConvexQuery(
    api.dashboard.getRecentActivity,
    { limit: 8 },
  );
  const { data: dailyViewsData, isLoading: chartLoading } = useConvexQuery(
    api.dashboard.getDailyViews,
  );

  // Format time relative to now
  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Loading states
  if (analyticsLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  // Default values if no data
  const stats = analytics || {
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollowers: 0,
    viewsGrowth: 0,
    likesGrowth: 0,
    commentsGrowth: 0,
    followersGrowth: 0,
  };

  const statCards = [
    {
      title: "Total Views",
      value: stats.totalViews,
      growth: stats.viewsGrowth,
      icon: Eye,
      iconColor: "text-blue-400",
    },
    {
      title: "Total Likes",
      value: stats.totalLikes,
      growth: stats.likesGrowth,
      icon: Heart,
      iconColor: "text-red-400",
    },
    {
      title: "Comments",
      value: stats.totalComments,
      growth: stats.commentsGrowth,
      icon: MessageCircle,
      iconColor: "text-yellow-400",
    },
    {
      title: "Followers",
      value: stats.totalFollowers,
      growth: stats.followersGrowth,
      icon: Users,
      iconColor: "text-green-400",
    },
  ];

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text-primary">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Welcome back! Here&apos;s what&apos;s happening with your content.
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button variant={"primary"}>
            <PlusCircle className="size-4 mr-2" />
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ title, value, growth, icon: Icon, iconColor }) => (
          <Card
            key={title}
            className="card-glass group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/30"
          >
            {/* soft gradient glow */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute -inset-1 bg-linear-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-xl" />
            </div>

            <CardHeader className="relative flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium tracking-wide text-slate-100 uppercase">
                {title}
              </CardTitle>

              <div className="flex size-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <Icon className={cn("size-5", iconColor)} />
              </div>
            </CardHeader>

            <CardContent className="relative">
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-white tracking-tight">
                  {value.toLocaleString()}
                </div>

                {growth > 0 && (
                  <span className="mb-1 inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                    <TrendingUp className="size-3 mr-1" />
                    {growth}%
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Compared to last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recent Posts</CardTitle>
                <Link href="/dashboard/posts">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-purple-400" />
                </div>
              ) : !recentPosts || recentPosts.length === 0 ? (
                <EmptyState
                  className="py-8"
                  title="No posts yet"
                  action={
                    <Link href="/dashboard/create">
                      <Button variant="outline" size="sm">
                        <PlusCircle className="size-4 mr-2" />
                        Create Your First Post
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div
                      key={post._id}
                      onClick={() =>
                        window.open(
                          `/dashboard/posts/edit/${post._id}`,
                          "_self",
                        )
                      }
                      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-800/30 hover:bg-slate-700/30 cursor-pointer rounded-lg transition-colors"
                    >
                      {/* LEFT: Title + status */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {post.title || "Untitled Post"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : post.status === "scheduled"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              post.status === "published"
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : post.status === "scheduled"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            }
                          >
                            {post.status}
                          </Badge>

                          <span className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">
                            {post.status === "published" && post.publishedAt
                              ? `Published ${formatTime(post.publishedAt)}`
                              : post.status === "draft"
                                ? `Updated ${formatTime(post.updatedAt)}`
                                : post.scheduledFor
                                  ? `Scheduled for ${new Date(post.scheduledFor).toLocaleDateString()}`
                                  : `Updated ${formatTime(post.updatedAt)}`}
                          </span>
                        </div>
                      </div>

                      {/* RIGHT: Stats */}
                      <div className="flex items-center justify-start sm:justify-end gap-4 text-xs sm:text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Eye className="size-4" />
                          {post.viewCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="size-4" />
                          {post.likeCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="size-4" />
                          {post.commentCount || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="size-5 mr-2" />
                Analytics Overview
              </CardTitle>
              <CardDescription>Views over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <DailyViewsChart data={dailyViewsData} isLoading={chartLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription>
                Latest interactions with your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-purple-400" />
                </div>
              ) : !recentActivity || recentActivity.length === 0 ? (
                <EmptyState className="py-8" title="No recent activity" />
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center text-xs ${
                          activity.type === "like"
                            ? "bg-red-500/20 text-red-300"
                            : activity.type === "comment"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {activity.type === "like" && (
                          <Heart className="size-3" />
                        )}
                        {activity.type === "comment" && (
                          <MessageCircle className="size-3" />
                        )}
                        {activity.type === "follow" && (
                          <Users className="size-3" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className="font-medium">{activity.user}</span>
                          {activity.type === "like" &&
                            ` liked your post "${activity.post}"`}
                          {activity.type === "comment" &&
                            ` commented on "${activity.post}"`}
                          {activity.type === "follow" &&
                            " started following you"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/create">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  <PlusCircle className="size-4 mr-2" />
                  Create New Post
                </Button>
              </Link>

              <Link href="/dashboard/posts">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  <Calendar className="size-4 mr-2" />
                  Manage Posts
                </Button>
              </Link>

              <Link href="/dashboard/followers">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  <Users className="size-4 mr-2" />
                  View Followers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
