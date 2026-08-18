"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import PostEditor from "@/components/post-editor";
import LoadingState from "@/components/loading-state";
import EmptyState from "@/components/empty-state";

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id;

  // Get post data
  const {
    data: post,
    isLoading,
    error,
  } = useConvexQuery(api.posts.getById, { id: postId });

  if (isLoading) {
    return <LoadingState message="Loading post..." />;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <EmptyState
          title="Post Not Found"
          description="The post you're looking for doesn't exist."
        />
      </div>
    );
  }

  return <PostEditor initialData={post} mode="edit" />;
}
