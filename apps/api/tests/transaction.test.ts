import request from "supertest"
import { describe, expect, it } from "vitest"

import { app } from "../src/server.ts"
import { Metric } from "@finance-tracker/db/metrics"
import { Transaction } from "@finance-tracker/db/transaction"
import { User } from "@finance-tracker/db/user"
import { createTransaction, registerUser } from "./helpers.ts"

describe("transaction API", () => {
  it("rejects unauthenticated reads and writes", async () => {
    const [list, create, update, remove, currency] = await Promise.all([
      request(app).get("/api/transaction"),
      request(app).post("/api/transaction").send({}),
      request(app)
        .put("/api/transaction")
        .send({ _id: "507f1f77bcf86cd799439011" }),
      request(app)
        .delete("/api/transaction")
        .send({ _id: "507f1f77bcf86cd799439011" }),
      request(app).put("/api/transaction/currency").send({ currency: "EUR" }),
    ])

    for (const response of [list, create, update, remove, currency]) {
      expect(response.status).toBe(401)
      expect(response.body).toMatchObject({
        statusCode: 401,
        success: false,
        code: "UNAUTHORIZED",
      })
    }
  })

  it("creates a transaction, returns it, and persists its metric", async () => {
    const user = await registerUser(request(app))
    const response = await createTransaction(request(app), user.accessToken, {
      amount: 125.5,
      type: "credit",
      date: "2026-10-15T12:00:00.000Z",
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      statusCode: 201,
      success: true,
      data: {
        user: user.response.body.data.userWithoutPassword._id,
        amount: 125.5,
        type: "credit",
        date: "2026-10-15T12:00:00.000Z",
      },
    })

    const transaction = await Transaction.findById(
      response.body.data._id
    ).lean()
    const metric = await Metric.findOne({
      user: user.response.body.data.userWithoutPassword._id,
      month: new Date("2026-10-01T00:00:00.000Z"),
    }).lean()

    expect(transaction).toMatchObject({
      amount: 125.5,
      type: "credit",
    })
    expect(transaction?.user.toString()).toBe(
      user.response.body.data.userWithoutPassword._id
    )
    expect(metric).toMatchObject({
      income: 125.5,
      expense: 0,
      netCashFlow: 125.5,
      weeklySummary: [
        { week: 3, income: 125.5, expense: 0, netCashFlow: 125.5 },
      ],
    })
  })

  it("rejects malformed transaction input before touching the database", async () => {
    const user = await registerUser(request(app))

    const invalidAmount = await createTransaction(
      request(app),
      user.accessToken,
      {
        amount: 0,
      }
    )
    const invalidDate = await createTransaction(
      request(app),
      user.accessToken,
      {
        date: "not-a-date",
      }
    )
    const invalidType = await createTransaction(
      request(app),
      user.accessToken,
      {
        type: "transfer" as "credit",
      }
    )

    for (const response of [invalidAmount, invalidDate, invalidType]) {
      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        statusCode: 400,
        success: false,
        code: "VALIDATION_ERROR",
      })
    }
    expect(await Transaction.countDocuments()).toBe(0)
    expect(await Metric.countDocuments()).toBe(0)
  })

  it("lists only the authenticated user's transactions in descending date order", async () => {
    const alice = await registerUser(request(app))
    const bob = await registerUser(request(app), {
      username: "bob-user",
      email: "bob@example.com",
    })

    await createTransaction(request(app), alice.accessToken, {
      amount: 10,
      date: "2026-10-10T12:00:00.000Z",
    })
    const newestAlice = await createTransaction(
      request(app),
      alice.accessToken,
      {
        amount: 20,
        date: "2026-10-20T12:00:00.000Z",
      }
    )
    await createTransaction(request(app), bob.accessToken, {
      amount: 999,
      date: "2026-10-25T12:00:00.000Z",
    })

    const response = await request(app)
      .get("/api/transaction")
      .set("Authorization", `Bearer ${alice.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.data.map((item: { _id: string }) => item._id)).toEqual(
      [newestAlice.body.data._id, expect.any(String)]
    )
    expect(
      response.body.data.every(
        (item: { user: string }) =>
          item.user.toString() ===
          alice.response.body.data.userWithoutPassword._id
      )
    ).toBe(true)
  })

  it("updates an owned transaction and keeps metric totals in sync", async () => {
    const user = await registerUser(request(app))
    const created = await createTransaction(request(app), user.accessToken, {
      amount: 100,
      type: "credit",
      date: "2026-10-10T12:00:00.000Z",
    })

    const response = await request(app)
      .put("/api/transaction")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({
        _id: created.body.data._id,
        amount: 40,
        date: "2026-10-20T12:00:00.000Z",
      })

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({
      _id: created.body.data._id,
      amount: 40,
      type: "credit",
    })
    expect(
      await Transaction.findById(created.body.data._id).lean()
    ).toMatchObject({
      amount: 40,
    })
    expect(
      await Metric.findOne({
        user: user.response.body.data.userWithoutPassword._id,
      }).lean()
    ).toMatchObject({
      income: 40,
      netCashFlow: 40,
    })
  })

  it("does not allow a user to update or delete another user's transaction", async () => {
    const owner = await registerUser(request(app))
    const attacker = await registerUser(request(app), {
      username: "attacker-user",
      email: "attacker@example.com",
    })
    const created = await createTransaction(request(app), owner.accessToken, {
      amount: 100,
    })

    const update = await request(app)
      .put("/api/transaction")
      .set("Authorization", `Bearer ${attacker.accessToken}`)
      .send({ _id: created.body.data._id, amount: 1 })
    const remove = await request(app)
      .delete("/api/transaction")
      .set("Authorization", `Bearer ${attacker.accessToken}`)
      .send({ _id: created.body.data._id })

    expect(update.status).toBe(404)
    expect(remove.status).toBe(404)
    expect(
      await Transaction.findById(created.body.data._id).lean()
    ).toMatchObject({
      amount: 100,
      user: owner.response.body.data.userWithoutPassword._id,
    })
  })

  it("returns client errors for malformed and missing transaction IDs", async () => {
    const user = await registerUser(request(app))

    const malformed = await request(app)
      .put("/api/transaction")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ _id: "not-an-object-id", amount: 10 })
    const missing = await request(app)
      .delete("/api/transaction")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ _id: "507f1f77bcf86cd799439011" })

    expect(malformed.status).toBe(400)
    expect(malformed.body).toMatchObject({
      statusCode: 400,
      success: false,
      code: "VALIDATION_ERROR",
    })
    expect(missing.status).toBe(404)
    expect(missing.body).toMatchObject({
      statusCode: 404,
      success: false,
      code: "NOT_FOUND",
    })
  })

  it("updates currency only when it is a supported value", async () => {
    const user = await registerUser(request(app))

    const valid = await request(app)
      .put("/api/transaction/currency")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ currency: "EUR" })
    const invalid = await request(app)
      .put("/api/transaction/currency")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ currency: "XYZ" })

    expect(valid.status).toBe(200)
    expect(valid.body.data).toMatchObject({
      username: user.credentials.username,
      email: user.credentials.email,
      currency: "EUR",
    })
    expect(invalid.status).toBe(400)
    expect(
      await User.findOne({ email: user.credentials.email }).lean()
    ).toMatchObject({
      currency: "EUR",
    })
  })

  it("deletes an owned transaction and reverses its metric", async () => {
    const user = await registerUser(request(app))
    const created = await createTransaction(request(app), user.accessToken, {
      amount: 75,
      type: "debit",
    })

    const response = await request(app)
      .delete("/api/transaction")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ _id: created.body.data._id })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      statusCode: 200,
      success: true,
      data: { _id: created.body.data._id, amount: 75, type: "debit" },
    })
    expect(await Transaction.exists({ _id: created.body.data._id })).toBeNull()
    expect(
      await Metric.findOne({
        user: user.response.body.data.userWithoutPassword._id,
      }).lean()
    ).toMatchObject({
      income: 0,
      expense: 0,
      netCashFlow: 0,
    })
  })
})
