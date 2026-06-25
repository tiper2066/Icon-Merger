import { afterEach, describe, expect, it } from "vitest";

import {
  getAdminEmails,
  getAllowedEmails,
  isEmailAdmin,
  isEmailAllowed,
  normalizeEmail,
} from "./allowed-emails";

const originalAllowedEmails = process.env.ALLOWED_GOOGLE_EMAILS;
const originalAdminEmails = process.env.ADMIN_GOOGLE_EMAILS;

afterEach(() => {
  process.env.ALLOWED_GOOGLE_EMAILS = originalAllowedEmails;
  process.env.ADMIN_GOOGLE_EMAILS = originalAdminEmails;
});

describe("allowed email helpers", () => {
  it("normalizes emails before comparing them", () => {
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
    expect(normalizeEmail(null)).toBe("");
  });

  it("parses comma-separated allowed emails and ignores blank entries", () => {
    process.env.ALLOWED_GOOGLE_EMAILS = " admin@example.com, , User@Example.com ";

    expect(getAllowedEmails()).toEqual(["admin@example.com", "user@example.com"]);
    expect(isEmailAllowed("USER@example.com")).toBe(true);
    expect(isEmailAllowed("other@example.com")).toBe(false);
  });

  it("parses admin emails independently from allowed emails", () => {
    process.env.ALLOWED_GOOGLE_EMAILS = "user@example.com";
    process.env.ADMIN_GOOGLE_EMAILS = " Admin@Example.com ";

    expect(getAdminEmails()).toEqual(["admin@example.com"]);
    expect(isEmailAllowed("admin@example.com")).toBe(false);
    expect(isEmailAdmin("admin@example.com")).toBe(true);
  });
});
