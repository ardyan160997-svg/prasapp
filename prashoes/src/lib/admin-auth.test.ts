import { afterEach, describe, expect, it } from "vitest";
import { createAdminSessionToken, getAdminSession, verifyAdminCredentials } from "./admin-auth";

const ORIGINAL_ENV = {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_USERNAMES: process.env.ADMIN_USERNAMES,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_AUTH_SECRET: process.env.ADMIN_AUTH_SECRET,
};

afterEach(() => {
  process.env.ADMIN_USERNAME = ORIGINAL_ENV.ADMIN_USERNAME;
  process.env.ADMIN_USERNAMES = ORIGINAL_ENV.ADMIN_USERNAMES;
  process.env.ADMIN_PASSWORD = ORIGINAL_ENV.ADMIN_PASSWORD;
  process.env.ADMIN_AUTH_SECRET = ORIGINAL_ENV.ADMIN_AUTH_SECRET;
});

describe("admin auth", () => {
  it("accepts any configured admin username with the shared password", () => {
    process.env.ADMIN_USERNAMES = "085601679005, 087728386861";
    process.env.ADMIN_PASSWORD = "prashoes1234";
    process.env.ADMIN_AUTH_SECRET = "secret-key";

    expect(verifyAdminCredentials("085601679005", "prashoes1234")).toBe(true);
    expect(verifyAdminCredentials("087728386861", "prashoes1234")).toBe(true);
    expect(verifyAdminCredentials("08123456789", "prashoes1234")).toBe(false);
    expect(verifyAdminCredentials("085601679005", "salah")).toBe(false);
  });

  it("keeps session valid for any configured admin username", () => {
    process.env.ADMIN_USERNAMES = "085601679005,087728386861";
    process.env.ADMIN_PASSWORD = "prashoes1234";
    process.env.ADMIN_AUTH_SECRET = "secret-key";

    const token = createAdminSessionToken("087728386861");
    const session = getAdminSession({
      get(name: string) {
        if (name !== "prashoes_admin_session") {
          return undefined;
        }

        return { value: token };
      },
    });

    expect(session).toMatchObject({ username: "087728386861" });
  });
});
