"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, UserPlus, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import PostCard from "@/components/post-card";
import PublicHeader from "./_components/public-header";
import LoadingState from "@/components/loading-state";
import EmptyState from "@/components/empty-state";

export default function ProfilePage({ params }) {
  const { username } =  use(params);
  const { user: currentUser } = useUser();

  // Get user profile
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useConvexQuery(api.users.getByUsername, { username });

  // Get user's posts
  const { data: postsData, isLoading: postsLoading } = useConvexQuery(
    api.public.getPublishedPostsByUsername,
    {
      username,
      limit: 20,
    },
  );

  // Get follower count
  const { data: followerCount } = useConvexQuery(
    api.follows.getFollowerCount,
    user ? { userId: user._id } : "skip",
  );

  // Check if current user is following this profile
  const { data: isFollowing } = useConvexQuery(
    api.follows.isFollowing,
    currentUser && user ? { followingId: user._id } : "skip",
  );

  // Follow mutation
  const toggleFollow = useConvexMutation(
    api.follows.toggleFollow,
    (localStore, args) => {
      const currentlyFollowing = localStore.getQuery(api.follows.isFollowing, {
        followingId: args.followingId,
      });
      if (currentlyFollowing !== undefined) {
        localStore.setQuery(
          api.follows.isFollowing,
          { followingId: args.followingId },
          !currentlyFollowing,
        );
      }

      const count = localStore.getQuery(api.follows.getFollowerCount, {
        userId: args.followingId,
      });
      if (count !== undefined) {
        localStore.setQuery(
          api.follows.getFollowerCount,
          { userId: args.followingId },
          count + (currentlyFollowing ? -1 : 1),
        );
      }
    },
  );

  if (userLoading || postsLoading) {
    return <LoadingState message="Loading profile..." className="min-h-screen" />;
  }

  if (userError || !user) {
    notFound();
  }

  const posts = postsData?.posts || [];
  const isOwnProfile =
    currentUser && currentUser.publicMetadata?.username === user.username;

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Please sign in to follow users");
      return;
    }

    try {
      await toggleFollow.mutate({ followingId: user._id });
    } catch (error) {
      toast.error(error.message || "Failed to update follow status");
    }
  };

  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);

  const stats = [
    { value: posts.length, label: "Posts" },
    { value: followerCount || 0, label: "Followers" },
    { value: totalViews.toLocaleString(), label: "Total Views" },
    { value: totalLikes.toLocaleString(), label: "Total Likes" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <PublicHeader link="/" title="Back to Home" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.name}
                fill
                className="rounded-full object-cover border-2 border-slate-700"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-2 gradient-text-primary">
            {user.name}
          </h1>

          <p className="text-xl text-slate-400 mb-4">@{user.username}</p>

          {/* Follow Button */}
          {!isOwnProfile && currentUser && (
            <Button
              onClick={handleFollowToggle}
              disabled={toggleFollow.isLoading}
              variant={isFollowing ? "outline" : "primary"}
              className="mb-4"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}

          <div className="flex items-center justify-center text-sm text-slate-500">
            <Calendar className="h-4 w-4 mr-2" />
            Joined{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Recent Posts</h2>

          {posts.length === 0 ? (
            <Card className="card-glass">
              <CardContent className="py-12">
                <EmptyState
                  title="No posts yet"
                  description="Check back later for new content!"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  showActions={false}
                  showAuthor={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
