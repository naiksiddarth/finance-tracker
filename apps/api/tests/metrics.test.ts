import request from "supertest"
import { describe, expect, it } from "vitest"

import { app } from "../src/server.ts"
import { Metric } from "@finance-tracker/db/metrics"
import { Transaction } from "@finance-tracker/db/transaction"
import { createTransaction, registerUser } from "./helpers.ts"

describe("metrics API", () => {
  it("aggregates a bounded date range and returns weekly cash-flow summaries", async () => {
    const user = await registerUser(request(app))

    await createTransaction(request(app), user.accessToken, {
      amount: 100,
      type: "credit",
      date: "2026-10-01T12:00:00.000Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 25,
      type: "debit",
      date: "2026-10-08T12:00:00.000Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 50,
      type: "credit",
      date: "2026-10-20T12:00:00.000Z",
    })

    const response = await request(app)
      .get("/api/metrics")
      .query({ startDate: "2026-10-01", endDate: "2026-10-20" })
      .set("Authorization", `Bearer ${user.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      data: {
        income: 150,
        expense: 25,
        netCashFlow: 125,
        totalBalance: 125,
        cashFlowSummary: {
          period: "week",
          summary: [
            { label: "Week 1", income: 100, expense: 0, netCashFlow: 100 },
            { label: "Week 2", income: 0, expense: 25, netCashFlow: -25 },
            { label: "Week 3", income: 50, expense: 0, netCashFlow: 50 },
          ],
        },
      },
    })
  })

  it("uses a complete-month metric and preserves zero-value weeks", async () => {
    const user = await registerUser(request(app))
    await createTransaction(request(app), user.accessToken, {
      amount: 80,
      type: "debit",
      date: "2026-10-31T12:00:00.000Z",
    })

    const response = await request(app)
      .get("/api/metrics")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${user.accessToken}`)

    const metric = await Metric.findOne({
      user: user.response.body.data.userWithoutPassword._id,
      month: new Date("2026-10-01T00:00:00.000Z"),
    }).lean()

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      income: 0,
      expense: 80,
      netCashFlow: -80,
      totalBalance: -80,
      cashFlowSummary: {
        period: "week",
        summary: expect.arrayContaining([
          { label: "Week 1", income: 0, expense: 0, netCashFlow: 0 },
          { label: "Week 5", income: 0, expense: 80, netCashFlow: -80 },
        ]),
      },
    })
    expect(metric).toMatchObject({ expense: 80, netCashFlow: -80 })
  })

  it("does not include another user's transactions or metrics", async () => {
    const alice = await registerUser(request(app))
    const bob = await registerUser(request(app), {
      username: "bob-user",
      email: "bob@example.com",
    })

    await createTransaction(request(app), alice.accessToken, {
      amount: 10,
      type: "credit",
      date: "2026-10-10T12:00:00.000Z",
    })
    await createTransaction(request(app), bob.accessToken, {
      amount: 900,
      type: "credit",
      date: "2026-10-10T12:00:00.000Z",
    })

    const response = await request(app)
      .get("/api/metrics")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${alice.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      income: 10,
      expense: 0,
      netCashFlow: 10,
      totalBalance: 10,
    })
    expect(
      await Transaction.countDocuments({
        user: alice.response.body.data.userWithoutPassword._id,
      })
    ).toBe(1)
  })

  it("rejects incomplete, reversed, and malformed date ranges", async () => {
    const user = await registerUser(request(app))
    const cases = [
      { startDate: "2026-10-01" },
      { startDate: "2026-10-20", endDate: "2026-10-01" },
      { startDate: "2026-13-01", endDate: "2026-10-01" },
    ]

    for (const query of cases) {
      const response = await request(app)
        .get("/api/metrics")
        .query(query)
        .set("Authorization", `Bearer ${user.accessToken}`)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        statusCode: 400,
        success: false,
        code: "VALIDATION_ERROR",
      })
    }
  })

  it("includes exact UTC month boundaries and excludes adjacent instants", async () => {
    const user = await registerUser(request(app))

    await createTransaction(request(app), user.accessToken, {
      amount: 10,
      type: "debit",
      date: "2026-08-31T23:59:59.999Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 20,
      type: "credit",
      date: "2026-09-01T00:00:00.000Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 30,
      type: "credit",
      date: "2026-09-30T23:59:59.999Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 40,
      type: "debit",
      date: "2026-10-01T00:00:00.000Z",
    })

    const response = await request(app)
      .get("/api/metrics")
      .query({ startDate: "2026-09-01", endDate: "2026-09-30" })
      .set("Authorization", `Bearer ${user.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      income: 50,
      expense: 0,
      netCashFlow: 50,
      totalBalance: 0,
    })
  })

  it("uses UTC calendar boundaries even when transaction offsets cross local dates", async () => {
    const user = await registerUser(request(app))

    // Local Oct 1 in UTC+05:30, but Sep 30 in UTC.
    await createTransaction(request(app), user.accessToken, {
      amount: 11,
      type: "credit",
      date: "2026-10-01T00:15:00+05:30",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 22,
      type: "credit",
      date: "2026-10-01T00:00:00.000Z",
    })
    // Local Oct 31 in UTC-07:00, but Nov 1 in UTC.
    await createTransaction(request(app), user.accessToken, {
      amount: 33,
      type: "credit",
      date: "2026-10-31T23:45:00-07:00",
    })

    const response = await request(app)
      .get("/api/metrics")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${user.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      income: 22,
      expense: 0,
      netCashFlow: 22,
    })
  })

  it("treats last-30-days ranges as inclusive of both UTC endpoints", async () => {
    const user = await registerUser(request(app))

    await createTransaction(request(app), user.accessToken, {
      amount: 1,
      type: "credit",
      date: "2026-10-01T23:59:59.999Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 2,
      type: "credit",
      date: "2026-10-02T00:00:00.000Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 3,
      type: "debit",
      date: "2026-10-31T23:59:59.999Z",
    })
    await createTransaction(request(app), user.accessToken, {
      amount: 4,
      type: "credit",
      date: "2026-11-01T00:00:00.000Z",
    })

    const response = await request(app)
      .get("/api/metrics")
      .query({ startDate: "2026-10-02", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${user.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      income: 2,
      expense: 3,
      netCashFlow: -1,
      totalBalance: 4,
    })
  })
})
