import { describe, expect, it } from 'vitest'

import {
  responseExplanation,
  responseFigure,
  responseSentence,
} from './responseTime'

describe('responseSentence', () => {
  it('maps each bucket to its sentence', () => {
    expect(responseSentence({ bucket: 'hour' })).toBe('Usually replies within an hour')
    expect(responseSentence({ bucket: 'hours' })).toBe('Usually replies within a few hours')
    expect(responseSentence({ bucket: 'day' })).toBe('Usually replies within a day')
    expect(responseSentence({ bucket: 'days' })).toBe('Usually replies within a few days')
    expect(responseSentence({ bucket: 'slow' })).toBe('Can be slow to reply')
  })

  it('returns null for an unknown bucket', () => {
    expect(responseSentence({ bucket: 'nope' })).toBeNull()
  })

  it('returns null when there is no response time', () => {
    expect(responseSentence(null)).toBeNull()
    expect(responseSentence(undefined)).toBeNull()
  })
})

describe('responseFigure', () => {
  it('shows "< 1 h" for sub-hour medians', () => {
    expect(responseFigure({ medianHours: 0.5 })).toBe('< 1 h')
  })

  it('rounds hours under a day', () => {
    expect(responseFigure({ medianHours: 3 })).toBe('3 h')
  })

  it('shows days once the median reaches a day', () => {
    expect(responseFigure({ medianHours: 24 })).toBe('1 day')
    expect(responseFigure({ medianHours: 48 })).toBe('2 days')
  })
})

describe('responseExplanation', () => {
  it('mentions the number of requests the median is based on', () => {
    expect(responseExplanation({ basedOn: 10 })).toContain('last 10 requests')
  })
})
