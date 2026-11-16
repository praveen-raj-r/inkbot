/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as feed from "../feed.js";
import type * as follows from "../follows.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_sanitize from "../lib/sanitize.js";
import type * as likes from "../likes.js";
import type * as migrations from "../migrations.js";
import type * as postActions from "../postActions.js";
import type * as posts from "../posts.js";
import type * as public_ from "../public.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  crons: typeof crons;
  dashboard: typeof dashboard;
  feed: typeof feed;
  follows: typeof follows;
  "lib/auth": typeof lib_auth;
  "lib/sanitize": typeof lib_sanitize;
  likes: typeof likes;
  migrations: typeof migrations;
  postActions: typeof postActions;
  posts: typeof posts;
  public: typeof public_;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
