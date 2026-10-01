import { describe, expect, it } from "vitest"

import { getDashboardDateRange } from "../src/lib/dashboard-date-range.ts"

describe("dashboard date ranges", () => {
  const date = new Date("2026-03-01T00:30:00.000Z")

  it("starts this-month at the UTC month boundary and ends today", () => {
    expect(getDashboardDateRange("thisMonth", date)).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    })
  })

  it("uses an inclusive 30-calendar-day window for last-30-days", () => {
    expect(
      getDashboardDateRange("last30Days", new Date("2026-03-31T23:59:59.999Z"))
    ).toEqual({
      startDate: "2026-03-02",
      endDate: "2026-03-31",
    })
  })

  it("handles last-30-days across a month boundary", () => {
    expect(
      getDashboardDateRange("last30Days", new Date("2026-03-01T00:30:00.000Z"))
    ).toEqual({
      startDate: "2026-01-31",
      endDate: "2026-03-01",
    })
  })

  it("starts year-to-date at January 1 in UTC", () => {
    expect(
      getDashboardDateRange("yearToDate", new Date("2026-12-31T23:59:59.999Z"))
    ).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })
  })
})
