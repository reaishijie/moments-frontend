import { describe, expect, it } from 'vitest'
import { formatTime, showDetailTime, showTime } from '~/utils/time'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('showTime', () => {
  const now = new Date('2026-06-01T12:00:00.000Z').getTime()

  it('一分钟内显示刚刚发布', () => {
    expect(showTime(now - 30 * 1000, now)).toBe('刚刚发布')
  })

  it('按分钟 / 小时 / 天显示相对时间', () => {
    expect(showTime(now - 5 * MINUTE, now)).toBe('5分钟前')
    expect(showTime(now - 3 * HOUR, now)).toBe('3小时前')
    expect(showTime(now - 2 * DAY, now)).toBe('2天前')
  })

  it('使用传入的 now 而不是系统时间', () => {
    expect(showTime(now - 5 * MINUTE, now)).toBe('5分钟前')
    expect(showTime(now - 5 * MINUTE, now + HOUR)).toBe('1小时前')
  })
})

describe('formatTime', () => {
  it('返回 UTC 时间字段', () => {
    const result = formatTime(new Date('2026-01-02T03:04:05.000Z').getTime())
    expect(result.year).toBe(2026)
    expect(result.month).toBe(1)
    expect(result.data).toBe(2)
    expect(result.hour).toBe(3)
    expect(result.minute).toBe(4)
  })
})

describe('showDetailTime', () => {
  it('返回本地化时间字符串', () => {
    const value = showDetailTime(new Date('2026-01-02T03:04:05.000Z').getTime())
    expect(typeof value).toBe('string')
    expect(value?.length).toBeGreaterThan(0)
  })
})
