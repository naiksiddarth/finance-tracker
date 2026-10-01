export interface DashboardDateRange {
  startDate: string
  endDate: string
}

function formatQueryDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getThisMonthRange(date: Date): DashboardDateRange {
  return {
    startDate: formatQueryDate(
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    ),
    endDate: formatQueryDate(date),
  }
}

export function getDashboardDateRange(
  period: "thisMonth" | "last30Days" | "yearToDate",
  date: Date
): DashboardDateRange {
  const endDate = formatQueryDate(date)

  if (period === "last30Days") {
    const startDate = new Date(date)
    startDate.setUTCDate(startDate.getUTCDate() - 29)
    return { startDate: formatQueryDate(startDate), endDate }
  }

  if (period === "yearToDate") {
    return {
      startDate: `${date.getUTCFullYear()}-01-01`,
      endDate,
    }
  }

  return getThisMonthRange(date)
}
