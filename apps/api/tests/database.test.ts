import { describe, expect, it } from "vitest"

import { Metric } from "@finance-tracker/db/metrics"
import { Transaction } from "@finance-tracker/db/transaction"
import { User } from "@finance-tracker/db/user"

describe("database invariants", () => {
  it("declares the indexes required by the current access patterns", () => {
    expect(User.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ username: 1 }, { unique: true }],
        [{ email: 1 }, { unique: true }],
      ])
    )
    expect(Metric.schema.indexes()).toEqual(
      expect.arrayContaining([[{ user: 1, month: 1 }, { unique: true }]])
    )
    expect(Transaction.schema.indexes()).toEqual(
      expect.arrayContaining([[{ user: 1, date: -1 }, {}]])
    )
  })
})
