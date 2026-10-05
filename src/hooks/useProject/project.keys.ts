export const PROJECT_KEYS = {
  all: ["project"] as const,
  // Now includes 'token' to prevent cache collisions between sessions
  admin: (token?: string | null) =>
    [...PROJECT_KEYS.all, "admin", token] as const,
  public: (token: string) => [...PROJECT_KEYS.all, "public", token] as const,
};
