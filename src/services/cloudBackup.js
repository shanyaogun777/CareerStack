/**
 * 将本地 IndexedDB 全量备份与 Supabase `user_backups` 表同步。
 * 依赖 RLS：用户仅能读写自己的行。
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { exportAllDataJson, importAllDataFromJson } from './dataBackup.js'

/**
 * @param {string} userId
 * @returns {Promise<{ payload: unknown; updated_at: string } | null>}
 */
export async function fetchUserBackupRow(userId) {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('user_backups')
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('fetchUserBackupRow', error)
    throw new Error(error.message || '无法读取云端备份')
  }
  if (!data?.payload) return null
  return { payload: data.payload, updated_at: data.updated_at }
}

/**
 * 上传当前本地全量数据到云端（覆盖该用户一行）。
 * @param {string} userId
 */
export async function uploadUserBackup(userId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('未配置云端同步')
  }
  const jsonText = await exportAllDataJson()
  let payload
  try {
    payload = JSON.parse(jsonText)
  } catch {
    throw new Error('导出数据格式无效')
  }

  const updated_at = new Date().toISOString()
  const { error } = await supabase.from('user_backups').upsert(
    {
      user_id: userId,
      payload,
      updated_at,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('uploadUserBackup', error)
    throw new Error(error.message || '上传备份失败')
  }
}

/**
 * 用云端 payload 覆盖本地 IndexedDB（与导入 JSON 文件相同逻辑）。
 * @param {unknown} payload — JSONB 对象（与导出 JSON 根对象同结构）
 */
export async function restoreLocalFromPayload(payload) {
  const text = JSON.stringify(payload)
  await importAllDataFromJson(text)
}

/**
 * @param {string} iso
 * @returns {string}
 */
export function formatBackupDate(iso) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return iso
  }
}
