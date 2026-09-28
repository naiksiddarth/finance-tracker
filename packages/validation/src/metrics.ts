import z from "zod"

export const MetricsQuerySchema = z
  .object({
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
  })
  .refine(({ startDate, endDate }) => Boolean(startDate) === Boolean(endDate), {
    message: "startDate and endDate must be provided together",
    path: ["startDate"],
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    {
      message: "startDate must be before or equal to endDate",
      path: ["startDate"],
    }
  )

export type MetricsQuery = z.infer<typeof MetricsQuerySchema>
