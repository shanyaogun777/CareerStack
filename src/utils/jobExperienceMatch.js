import { normalizeStructuredJD } from '../services/db'

/**
 * 根据结构化 JD 中的「关键技能点」为个人信息库条目打分并排序。
 * @param {import('../services/db.js').StructuredJD | null | undefined} structuredJD
 * @param {import('../services/db.js').Experience[]} experiences
 * @param {number} [limit]
 * @returns {import('../services/db.js').Experience[]}
 */
export function recommendExperiences(structuredJD, experiences, limit = 10) {
  const s = normalizeStructuredJD(structuredJD)
  const raw = Array.isArray(s.关键技能点) ? s.关键技能点 : []
  /** @type {string[]} */
  const kws = []
  for (const x of raw) {
    for (const p of String(x).split(/[,，、]/)) {
      const t = p.trim()
      if (t.length >= 2) kws.push(t)
    }
  }
  const uniq = [...new Set(kws.map((k) => k.toLowerCase()))]
  if (uniq.length === 0) return []

  const scored = experiences.map((exp) => {
    const hay = [exp.company, exp.role, exp.type, ...(exp.tags || []), exp.description]
      .join('\n')
      .toLowerCase()
    let score = 0
    for (const kw of uniq) {
      if (hay.includes(kw)) score += 3
      else if (kw.length > 4) {
        const sub = kw.slice(0, Math.max(4, kw.length - 1))
        if (hay.includes(sub)) score += 1
      }
    }
    return { exp, score }
  })

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.exp)
}
