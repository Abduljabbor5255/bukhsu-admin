// Date utility functions
import { RX_DATE, RX_DATE_SPLIT } from '@/constants/regex'
import { isDate, isString } from './inspect'
import { toInteger } from './number'

// --- Date utility methods ---

// Create or clone a date (`new Date(...)` shortcut)
export const createDate = (...args) => new Date(...args)

// Parse a date sting, or Date object, into a Date object (with no time information)
export const parseYMD = date => {
  if (isString(date) && RX_DATE.test(date.trim())) {
    const [year, month, day] = date.split(RX_DATE_SPLIT).map(v => toInteger(v, 1))

    return createDate(year, month - 1, day)
  } else if (isDate(date)) {
    return createDate(date.getFullYear(), date.getMonth(), date.getDate())
  }

  return null
}

// Format a date object as `YYYY-MM-DD` format
export const formatYMD = date => {
  date = parseYMD(date)
  if (!date) {
    return null
  }
  const year = date.getFullYear()
  const month = `0${date.getMonth() + 1}`.slice(-2)
  const day = `0${date.getDate()}`.slice(-2)

  return `${year}-${month}-${day}`
}

export const formatDMY = date => {
  date = parseYMD(date)
  if (!date) {
    return null
  }
  const year = date.getFullYear()
  const month = `0${date.getMonth() + 1}`.slice(-2)
  const day = `0${date.getDate()}`.slice(-2)

  return `${day}-${month}-${year}`
}

export function formatDate(rawDate) {
  const date = new Date(rawDate)
  const year = date.getFullYear()
  const baseMonth = date.getMonth() + 1
  const month = baseMonth < 10 ? `0${baseMonth}` : baseMonth
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

  return `${day}-${month}-${year}`
}

// Create a `Intl.DateTimeFormat` formatter function
export const createDateFormatter = (locale, options) => /* istanbul ignore next */ {
  const dtf = new Intl.DateTimeFormat(locale, options)

  return dtf.format
}

// Determine if two dates are the same date (ignoring time portion)
export const datesEqual = (date1, date2) => {
  // Returns true of the date portion of two date objects are equal
  // We don't compare the time portion
  return formatYMD(date1) === formatYMD(date2)
}

// --- Date "math" utility methods (for BCalendar components mainly) ---

export const firstDateOfMonth = date => {
  date = createDate(date)
  date.setDate(1)

  return date
}

export const lastDateOfMonth = date => {
  date = createDate(date)
  date.setMonth(date.getMonth() + 1)
  date.setDate(0)

  return date
}

export const addYears = (date, numberOfYears) => {
  date = createDate(date)

  const month = date.getMonth()

  date.setFullYear(date.getFullYear() + numberOfYears)

  // Handle Feb 29th for leap years
  if (date.getMonth() !== month) {
    date.setDate(0)
  }

  return date
}

export const oneMonthAgo = date => {
  date = createDate(date)

  const month = date.getMonth()

  date.setMonth(month - 1)

  // Handle when days in month are different
  if (date.getMonth() === month) {
    date.setDate(0)
  }

  return date
}

export const oneMonthAhead = date => {
  date = createDate(date)

  const month = date.getMonth()

  date.setMonth(month + 1)

  // Handle when days in month are different
  if (date.getMonth() === (month + 2) % 12) {
    date.setDate(0)
  }

  return date
}

export const oneYearAgo = date => {
  return addYears(date, -1)
}

export const oneYearAhead = date => {
  return addYears(date, 1)
}

export const oneDecadeAgo = date => {
  return addYears(date, -10)
}

export const oneDecadeAhead = date => {
  return addYears(date, 10)
}

// Helper function to constrain a date between two values
// Always returns a `Date` object or `null` if no date passed
export const constrainDate = (date, min = null, max = null) => {
  // Ensure values are `Date` objects (or `null`)
  date = parseYMD(date)
  min = parseYMD(min) || date
  max = parseYMD(max) || date

  // Return a new `Date` object (or `null`)
  return date ? (date < min ? min : date > max ? max : date) : null
}

export const getFirstDateOfMonth = d => {
  const date = new Date(d)
  const longFirstDay = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(new Date(longFirstDay).getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getLastDateOfMonth = d => {
  const date = new Date(d)
  const longLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const year = String(new Date(longLastDay).getFullYear())
  const month = String(new Date(longLastDay).getMonth() + 1).padStart(2, '0')
  const day = String(new Date(longLastDay).getDate())

  return `${year}-${month}-${day}`
}
