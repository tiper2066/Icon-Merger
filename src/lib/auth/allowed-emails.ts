export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function getAllowedEmails() {
  return (process.env.ALLOWED_GOOGLE_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export function getAdminEmails() {
  return (process.env.ADMIN_GOOGLE_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return new Set(getAllowedEmails()).has(normalizedEmail);
}

export function isEmailAdmin(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return new Set(getAdminEmails()).has(normalizedEmail);
}
