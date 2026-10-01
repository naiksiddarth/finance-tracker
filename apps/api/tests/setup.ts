import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { afterAll, afterEach, beforeAll } from "vitest"

import { Metric } from "@finance-tracker/db/metrics"
import { Transaction } from "@finance-tracker/db/transaction"
import { User } from "@finance-tracker/db/user"

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret-with-enough-entropy"
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-with-enough-entropy"
  process.env.NODE_ENV = "test"

  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
  await Promise.all([
    User.syncIndexes(),
    Transaction.syncIndexes(),
    Metric.syncIndexes(),
  ])
})

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Metric.deleteMany({}),
  ])
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})
