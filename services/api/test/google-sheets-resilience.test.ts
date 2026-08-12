import { describe, expect, it, vi } from "vitest";
import type { Environment } from "../src/config/env.js";
import { GoogleSheetsStore } from "../src/repositories/google-sheets-store.js";

const environment: Environment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 8080,
  LOG_LEVEL: "silent",
  ALLOWED_ORIGINS: "*",
  DATA_PROVIDER: "google-sheets",
  GOOGLE_SHEET_ID: "test-spreadsheet",
  GOOGLE_SERVICE_ACCOUNT_JSON: "{}",
  GOOGLE_SHEETS_MAX_ATTEMPTS: 3,
  GOOGLE_SHEETS_RETRY_BASE_MS: 10,
  JWT_SECRET: "test-only-jwt-secret-with-more-than-32-characters",
  JWT_EXPIRES_IN: "1h",
};

function providerError(status: number): Error & { response: { status: number } } {
  return Object.assign(new Error(`Provider status ${status}`), { response: { status } });
}

function valuesClient(get: ReturnType<typeof vi.fn>) {
  return {
    get,
    update: vi.fn(),
    append: vi.fn(),
    batchUpdate: vi.fn(),
  };
}

describe("GoogleSheetsStore resilience", () => {
  it("retries quota responses with bounded exponential backoff", async () => {
    const planHeaders = [
      "Plan_ID",
      "Plan_Name",
      "Plan_Positioning",
      "Monthly_Price_INR",
      "Annual_Price_INR",
      "Max_Children",
      "Included_Assessments_Per_Year",
      "Question_Count",
      "Skills_Visible",
      "Missions_Per_Skill",
      "Journey_Length_Days",
      "Passion_Insights_Level",
      "GrowScore_Enabled",
      "Growth_Tracker_Enabled",
      "Growth_Timeline_Enabled",
      "Assessment_History_Access",
      "Assessment_Comparison",
      "Weekly_Summary_Enabled",
      "Monthly_Report_Enabled",
      "Advanced_Analytics_Enabled",
      "Parent_Guidance_Level",
      "Priority_Support",
      "Report_Export",
      "Multi_Language_Level",
      "Display_Order",
      "Recommended_Flag",
    ];
    const get = vi
      .fn()
      .mockRejectedValueOnce(providerError(429))
      .mockRejectedValueOnce(providerError(503))
      .mockResolvedValue({ data: { values: [planHeaders] } });
    const delays: number[] = [];
    const store = new GoogleSheetsStore(environment, {
      valuesClient: valuesClient(get),
      sleep: async (milliseconds) => {
        delays.push(milliseconds);
      },
      random: () => 0,
    });

    await expect(store.listPlanEntitlements()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([10, 20]);
  });

  it("does not retry permanent provider errors", async () => {
    const get = vi.fn().mockRejectedValue(providerError(403));
    const store = new GoogleSheetsStore(environment, {
      valuesClient: valuesClient(get),
      sleep: async () => undefined,
    });

    await expect(store.listPlanEntitlements()).rejects.toThrow(
      "Google Sheets read failed after 3 attempts (provider status 403)",
    );
    expect(get).toHaveBeenCalledOnce();
  });

  it("rejects corrupted tables with actionable header details", async () => {
    const get = vi.fn().mockResolvedValue({
      data: { values: [["Plan_ID", "Plan_Name"], ["PLN001", "Explorer"]] },
    });
    const store = new GoogleSheetsStore(environment, {
      valuesClient: valuesClient(get),
      sleep: async () => undefined,
    });

    await expect(store.listPlanEntitlements()).rejects.toThrow(
      "18_Subscription_Master is missing required headers",
    );
    expect(get).toHaveBeenCalledOnce();
  });
});
