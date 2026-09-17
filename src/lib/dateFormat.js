import { addDays, format, isBefore, startOfDay } from 'date-fns'

// "yyyy-MM-dd" 문자열은 항상 로컬 자정 기준으로 해석한다.
// date-fns의 parseISO나 new Date(str)는 UTC 자정으로 해석해서, 타임존에 따라
// 하루씩 어긋나는 문제가 있었다 (표시되는 날짜가 저장된 날짜와 안 맞는 버그의 원인).
export function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatShortDate(isoDate) {
  return format(parseLocalDate(isoDate), 'M/d')
}

export function toDateStr(date) {
  return format(date, 'yyyy-MM-dd')
}

export function todayStr() {
  return toDateStr(new Date())
}

export function addDaysStr(isoDate, amount) {
  const base = isoDate ? parseLocalDate(isoDate) : new Date()
  return toDateStr(addDays(base, amount))
}

export function isOverdue(isoDate, done) {
  if (!isoDate || done) return false
  return isBefore(parseLocalDate(isoDate), startOfDay(new Date()))
}
