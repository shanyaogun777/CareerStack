import { useEffect, useMemo } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { EditablePlain } from './EditablePlain'

function filled(v) {
  return String(v ?? '').trim().length > 0
}

/**
 * @param {{
 *   label: string
 *   checked: boolean
 *   onChange: (next: boolean) => void
 * }} props
 */
function FieldToggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-600">
      <input
        type="checkbox"
        className="size-3.5 rounded border-slate-300 text-slate-700 accent-slate-600 focus:ring-slate-200"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

/**
 * @param {{
 *   basics: import('../../services/db.js').ResumeBasics
 *   patchBasics: (p: Partial<import('../../services/db.js').ResumeBasics>) => void
 * }} props
 */
export function ResumeBasicsSection({ basics, patchBasics }) {
  const blob = basics.avatarBlob instanceof Blob ? basics.avatarBlob : null
  const shape = basics.avatarShape === 'square' ? 'square' : 'circle'
  const size = Math.min(
    128,
    Math.max(56, Number(basics.avatarSizePx) || 88),
  )

  const objectUrl = useMemo(() => {
    if (!blob) return null
    return URL.createObjectURL(blob)
  }, [blob])

  useEffect(() => {
    if (!objectUrl) return
    return () => URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  const showAvatar = Boolean(blob)
  const showName = filled(basics.name)
  const showTitle = filled(basics.title)

  const lines = useMemo(
    () =>
      [
        basics.showPhone !== false && filled(basics.phone)
          ? { key: 'phone', label: '电话', value: basics.phone }
          : null,
        basics.showEmail !== false && filled(basics.email)
          ? { key: 'email', label: '邮箱', value: basics.email }
          : null,
        basics.showWechat !== false && filled(basics.wechat)
          ? { key: 'wechat', label: '微信', value: basics.wechat }
          : null,
        basics.showAge !== false && filled(basics.age)
          ? { key: 'age', label: '年龄', value: basics.age }
          : null,
        basics.showLocation !== false && filled(basics.location)
          ? { key: 'location', label: '所在地', value: basics.location }
          : null,
        basics.showExpectedLocation !== false &&
        filled(basics.expectedLocation)
          ? {
              key: 'expectedLocation',
              label: '期望工作地',
              value: basics.expectedLocation,
            }
          : null,
        basics.showExpectedPosition !== false &&
        filled(basics.expectedPosition)
          ? {
              key: 'expectedPosition',
              label: '期望职位',
              value: basics.expectedPosition,
            }
          : null,
        basics.showExpectedSalary !== false && filled(basics.expectedSalary)
          ? {
              key: 'expectedSalary',
              label: '期望薪资',
              value: basics.expectedSalary,
            }
          : null,
        basics.showGender !== false && filled(basics.gender)
          ? { key: 'gender', label: '性别', value: basics.gender }
          : null,
        basics.showPoliticalStatus !== false && filled(basics.politicalStatus)
          ? {
              key: 'politicalStatus',
              label: '政治面貌',
              value: basics.politicalStatus,
            }
          : null,
      ].filter(Boolean),
    [basics],
  )

  const inputCls =
    'w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-[11px] text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-100'

  return (
    <section className="mb-9">
      <h2 className="mb-4 border-b border-slate-800/35 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-800">
        基本信息
      </h2>

      <div className="resume-ui-only mb-4 space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
        <p className="text-[10px] font-medium text-slate-500">
          编辑字段与展示开关；画布与 PDF 仅显示已填写且已勾选展示的内容。
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium text-slate-600">头像</span>
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-700 transition-colors hover:bg-slate-50/90">
                <ImagePlus className="size-[14px] text-slate-400" strokeWidth={1.5} aria-hidden />
                上传照片
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (!f || !f.type.startsWith('image/')) return
                    void f.arrayBuffer().then((buf) => {
                      const b = new Blob([buf], { type: f.type })
                      patchBasics({ avatarBlob: b, avatarMimeType: f.type })
                    })
                  }}
                />
              </label>
              {blob ? (
                <button
                  type="button"
                  onClick={() =>
                    patchBasics({
                      avatarBlob: undefined,
                      avatarMimeType: undefined,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-red-100/90 bg-white px-2 py-1.5 text-[10px] font-medium text-red-500/90 transition-colors hover:bg-red-50/80"
                >
                  <Trash2 className="size-[14px] text-slate-400" strokeWidth={1.5} aria-hidden />
                  移除
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-500">形状</span>
              <button
                type="button"
                onClick={() => patchBasics({ avatarShape: 'circle' })}
                className={cn(
                  'rounded border px-2 py-0.5 text-[10px]',
                  shape === 'circle'
                    ? 'border-slate-700 bg-slate-700 text-white'
                    : 'border-slate-200/90 bg-white text-slate-600',
                )}
              >
                圆形
              </button>
              <button
                type="button"
                onClick={() => patchBasics({ avatarShape: 'square' })}
                className={cn(
                  'rounded border px-2 py-0.5 text-[10px]',
                  shape === 'square'
                    ? 'border-slate-700 bg-slate-700 text-white'
                    : 'border-slate-200/90 bg-white text-slate-600',
                )}
              >
                方形
              </button>
            </div>
            <div className="flex max-w-[200px] flex-col gap-1">
              <label className="text-[10px] text-slate-500">
                尺寸 {size}px
              </label>
              <input
                type="range"
                min={56}
                max={128}
                value={size}
                onChange={(e) =>
                  patchBasics({ avatarSizePx: Number(e.target.value) })
                }
                className="h-1 w-full accent-slate-600"
              />
            </div>
          </div>

          <div className="min-w-[220px] flex-1 space-y-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-slate-600">
                姓名
              </label>
              <input
                className={inputCls}
                value={basics.name}
                onChange={(e) => patchBasics({ name: e.target.value })}
                placeholder="姓名"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-slate-600">
                标题 / 定位
              </label>
              <input
                className={inputCls}
                value={basics.title}
                onChange={(e) => patchBasics({ title: e.target.value })}
                placeholder="如：产品经理 · 3 年经验"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-lg border border-slate-100 bg-white p-2.5">
            <div className="text-[10px] font-semibold text-slate-700">核心信息</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-100 pb-2">
              <FieldToggle
                label="展示邮箱"
                checked={basics.showEmail !== false}
                onChange={(v) => patchBasics({ showEmail: v })}
              />
              <FieldToggle
                label="展示电话"
                checked={basics.showPhone !== false}
                onChange={(v) => patchBasics({ showPhone: v })}
              />
              <FieldToggle
                label="展示微信"
                checked={basics.showWechat !== false}
                onChange={(v) => patchBasics({ showWechat: v })}
              />
              <FieldToggle
                label="展示年龄"
                checked={basics.showAge !== false}
                onChange={(v) => patchBasics({ showAge: v })}
              />
            </div>
            <input
              className={inputCls}
              placeholder="邮箱"
              value={basics.email}
              onChange={(e) => patchBasics({ email: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="电话"
              value={basics.phone}
              onChange={(e) => patchBasics({ phone: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="微信"
              value={basics.wechat}
              onChange={(e) => patchBasics({ wechat: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="年龄"
              value={basics.age}
              onChange={(e) => patchBasics({ age: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 rounded-lg border border-slate-100 bg-white p-2.5">
            <div className="text-[10px] font-semibold text-slate-700">期望信息</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-100 pb-2">
              <FieldToggle
                label="期望工作地"
                checked={basics.showExpectedLocation !== false}
                onChange={(v) => patchBasics({ showExpectedLocation: v })}
              />
              <FieldToggle
                label="期望职位"
                checked={basics.showExpectedPosition !== false}
                onChange={(v) => patchBasics({ showExpectedPosition: v })}
              />
              <FieldToggle
                label="期望薪资"
                checked={basics.showExpectedSalary !== false}
                onChange={(v) => patchBasics({ showExpectedSalary: v })}
              />
            </div>
            <input
              className={inputCls}
              placeholder="期望工作地"
              value={basics.expectedLocation}
              onChange={(e) =>
                patchBasics({ expectedLocation: e.target.value })
              }
            />
            <input
              className={inputCls}
              placeholder="期望职位"
              value={basics.expectedPosition}
              onChange={(e) =>
                patchBasics({ expectedPosition: e.target.value })
              }
            />
            <input
              className={inputCls}
              placeholder="期望薪资"
              value={basics.expectedSalary}
              onChange={(e) =>
                patchBasics({ expectedSalary: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5 rounded-lg border border-slate-100 bg-white p-2.5 sm:col-span-2">
            <div className="text-[10px] font-semibold text-slate-700">
              个人背景
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-100 pb-2">
              <FieldToggle
                label="展示所在地"
                checked={basics.showLocation !== false}
                onChange={(v) => patchBasics({ showLocation: v })}
              />
              <FieldToggle
                label="展示性别"
                checked={basics.showGender !== false}
                onChange={(v) => patchBasics({ showGender: v })}
              />
              <FieldToggle
                label="展示政治面貌"
                checked={basics.showPoliticalStatus !== false}
                onChange={(v) => patchBasics({ showPoliticalStatus: v })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className={inputCls}
                placeholder="所在地"
                value={basics.location}
                onChange={(e) => patchBasics({ location: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="性别"
                value={basics.gender}
                onChange={(e) => patchBasics({ gender: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="政治面貌"
                value={basics.politicalStatus}
                onChange={(e) =>
                  patchBasics({ politicalStatus: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        {showAvatar && objectUrl ? (
          <div className="shrink-0">
            <img
              src={objectUrl}
              alt=""
              width={size}
              height={size}
              className={cn(
                'border border-slate-200/90 bg-slate-50/80 object-cover shadow-sm',
                shape === 'circle' ? 'rounded-full' : 'rounded-md',
              )}
              style={{ width: size, height: size }}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          {showName ? (
            <EditablePlain
              as="div"
              value={basics.name}
              onCommit={(v) => patchBasics({ name: v })}
              className="text-[22px] font-semibold leading-tight tracking-tight text-slate-800"
            />
          ) : null}
          {showTitle ? (
            <EditablePlain
              as="div"
              value={basics.title}
              onCommit={(v) => patchBasics({ title: v })}
              className="text-[12px] leading-snug text-slate-600"
            />
          ) : null}
          {lines.length > 0 ? (
            <div className="grid gap-x-6 gap-y-1.5 pt-2 sm:grid-cols-2">
              {lines.map(
                (row) =>
                  row && (
                    <div
                      key={row.key}
                      className="text-[11px] leading-relaxed text-slate-600"
                    >
                      <span className="text-slate-400">{row.label} </span>
                      <span className="text-slate-800">{row.value}</span>
                    </div>
                  ),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
