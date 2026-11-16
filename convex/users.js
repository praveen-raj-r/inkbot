import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib/auth";

// Routes that live at /<segment> and must not be claimable as usernames.
const RESERVED_USERNAMES = new Set([
  "dashboard", "feed", "sign-in", "sign-up", "api", "admin", "settings",
  "create", "posts", "followers", "login", "logout", "about", "help",
]);

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
      const patch = {};
      if (identity.name && user.name !== identity.name)
        patch.name = identity.name;
      if (identity.email && user.email !== identity.email)
        patch.email = identity.email;
      if (identity.pictureUrl && user.imageUrl !== identity.pictureUrl)
        patch.imageUrl = identity.pictureUrl;
      if (Object.keys(patch).length > 0) await ctx.db.patch(user._id, patch);
      return user._id;
    }

    // If it's a new identity, create a new `User`.
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      imageUrl: identity.pictureUrl,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    return await getCurrentUserOrThrow(ctx);
  },
});

// Update username (checks availability and updates)
export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Usernames are stored lowercase so lookups are case-insensitive.
    const username = args.username.toLowerCase();

    // Validate username format
    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error(
        "Username can only contain letters, numbers, underscores, and hyphens",
      );
    }

    if (username.length < 3 || username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }

    if (RESERVED_USERNAMES.has(username)) {
      return { ok: false, code: "USERNAME_TAKEN" };
    }

    // Check if username is already taken (skip check if it's the same as current)
    if (username !== (user.username ?? "")) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();

      if (existingUser && existingUser._id !== user._id) {
        return {
          ok: false,
          code: "USERNAME_TAKEN",
        };
      }
    }

    // Update username
    await ctx.db.patch(user._id, {
      username,
      lastActiveAt: Date.now(),
    });

    return user._id;
  },
});

// Get user by username (for public profiles)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", args.username.toLowerCase())
      )
      .unique();

    if (!user) {
      return null;
    }

    // Return only public fields
    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
    };
  },
});
