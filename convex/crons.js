import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Publish scheduled posts once their time has passed.
crons.interval(
  "publish scheduled posts",
  { minutes: 1 },
  internal.posts.publishDueScheduled
);

export default crons;
