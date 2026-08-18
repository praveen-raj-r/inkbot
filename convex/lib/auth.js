// Shared current-user lookup, backed by the `by_token` index so every
// caller gets an indexed lookup instead of a full users-table scan.

async function findUserByToken(ctx, tokenIdentifier) {
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

// Returns the current user, or null if not signed in / not yet stored.
export async function getCurrentUser(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await findUserByToken(ctx, identity.tokenIdentifier);
}

// Same as getCurrentUser, but throws for handlers that require auth.
export async function getCurrentUserOrThrow(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await findUserByToken(ctx, identity.tokenIdentifier);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
