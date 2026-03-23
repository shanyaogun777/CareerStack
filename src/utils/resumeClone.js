/**
 * 从个人信息库条目生成简历内独立副本（不含附件 Blob，避免简历记录膨胀）。
 * @param {import('../services/db.js').Experience} exp
 */
export function createResumeBlockFromExperience(exp) {
  return {
    id: crypto.randomUUID(),
    sourceExperienceId: exp.id,
    type: exp.type ?? '',
    company: exp.company ?? '',
    role: exp.role ?? '',
    tags: Array.isArray(exp.tags) ? [...exp.tags] : [],
    startDate: exp.startDate ?? '',
    endDate: exp.endDate ?? '',
    description: exp.description ?? '',
  }
}

