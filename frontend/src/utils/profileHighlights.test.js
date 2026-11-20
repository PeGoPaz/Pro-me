import { describe, expect, it } from 'vitest'

import { profileHighlights } from './profileHighlights'

const labels = {
  counties: { dublin: 'Dublin', kildare: 'Kildare' },
  centres: { finglas: 'Finglas' },
  categories: { B: 'Car' },
}

const aoife = {
  isVerified: true,
  counties: ['dublin', 'kildare'],
  testCentres: ['finglas'],
  licenceCategories: ['B'],
  transmission: ['automatic', 'manual'],
  pricePerLesson: 45,
  acceptingNewStudents: true,
  responseTime: { medianHours: 2.4, bucket: 'hours', basedOn: 12 },
}

describe('profileHighlights', () => {
  it('builds one highlight per thing the profile can show, in order', () => {
    expect(profileHighlights(aoife, labels).map((h) => h.id)).toEqual(['verified', 'areas', 'teaches', 'prices', 'replies'])
  })

  it('uses the names of counties, test centres and licences rather than their codes', () => {
    const [, areas, teaches] = profileHighlights(aoife, labels)
    expect(areas.sections).toEqual([
      { heading: 'Counties', items: ['Dublin', 'Kildare'] },
      { heading: 'Test centres', items: ['Finglas'] },
    ])
    expect(teaches.sections).toEqual([
      { heading: 'Licences', items: ['Car (B)'] },
      { heading: 'Gearbox', items: ['Automatic', 'Manual'] },
    ])
  })

  it('leaves out what the profile does not have', () => {
    const bare = { counties: ['cork'], acceptingNewStudents: false }
    const highlights = profileHighlights(bare)
    expect(highlights.map((h) => h.id)).toEqual(['areas', 'prices'])
    expect(highlights[0].sections).toEqual([{ heading: 'County', items: ['cork'] }])
    expect(highlights[1].sections).toEqual([{ heading: 'New learners', items: ['Not taking new learners right now'] }])
  })

  it('explains the reply time it shows', () => {
    const replies = profileHighlights(aoife, labels).at(-1)
    expect(replies.sections[0]).toEqual({ heading: 'Typical reply', items: ['2 h'] })
    expect(replies.note).toMatch(/last 12 requests/)
  })
})
