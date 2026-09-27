import { describe, expect, it } from 'vitest'
import { clamp, formatBytes, formatDate } from './utils'

describe('formatDate', () => {
  it('默认格式化为 YYYY-MM-DD HH:mm:ss', () => {
    const ts = new Date(2026, 8, 27, 9, 5, 3).getTime()
    expect(formatDate(ts)).toBe('2026-09-27 09:05:03')
  })

  it('支持自定义格式', () => {
    const ts = new Date(2026, 0, 5, 1, 2, 3).getTime()
    expect(formatDate(ts, 'YYYY/MM/DD')).toBe('2026/01/05')
  })

  it('非法输入返回空字符串', () => {
    expect(formatDate(NaN)).toBe('')
  })
})

describe('formatBytes', () => {
  it('0 与非法输入', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-1)).toBe('0 B')
  })

  it('进位到 KB / MB', () => {
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.50 MB')
  })

  it('超出最大单位时停留在 TB', () => {
    expect(formatBytes(1024 ** 4)).toBe('1.00 TB')
    expect(formatBytes(1024 ** 5)).toBe('1024.00 TB')
  })
})

describe('clamp', () => {
  it('限制在区间内', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})
