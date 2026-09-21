import { invoke, isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { supabase, supabaseConfigured } from './supabase.js'

const runningInTauri = isTauri()

const DEFAULT_DATA = { projects: [] }

function isValidData(data) {
  return Boolean(data) && Array.isArray(data.projects)
}

async function currentUserId() {
  if (!supabaseConfigured) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// 데스크톱(Tauri)에서만 쓰는, 컴퓨터 안 파일 캐시 — 오프라인일 때도 계속 쓸 수 있게 해준다.
async function loadLocalCache() {
  if (!runningInTauri) return null
  try {
    const data = await invoke('load_data')
    return isValidData(data) ? data : null
  } catch {
    return null
  }
}

function saveLocalCache(data) {
  if (!runningInTauri) return
  invoke('save_data', { data }).catch(() => {
    // 로컬 저장 실패는 조용히 무시 — 클라우드 저장이 우선이다.
  })
}

// 불러오기: 클라우드(Supabase)가 있으면 그게 정답. 없으면(오프라인, 또는 로그인 직후 첫 동기화 전)
// 로컬 캐시로 대신한다. 로컬에만 있던 데이터는 온라인이 되는 순간 클라우드로 올라간다(seed).
export async function loadData() {
  const localData = await loadLocalCache()
  const userId = await currentUserId()
  if (!userId) return localData || DEFAULT_DATA

  try {
    const { data: row, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error

    if (row && isValidData(row.data)) {
      saveLocalCache(row.data)
      return row.data
    }

    // 클라우드에 아직 데이터가 없음 — 로컬에 있던 걸 처음 한 번 올려서 시드로 삼는다.
    if (localData) {
      await saveData(localData)
      return localData
    }
    return DEFAULT_DATA
  } catch {
    // 네트워크가 없거나 요청이 실패하면 로컬 캐시로 대신한다(오프라인 모드).
    return localData || DEFAULT_DATA
  }
}

export async function saveData(data) {
  saveLocalCache(data)
  const userId = await currentUserId()
  if (!userId) return
  await supabase
    .from('app_data')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
    .then(null, () => {
      // 저장 실패(오프라인 등)는 조용히 무시 — 로컬 캐시는 이미 저장됐고, 다음 저장 때 다시 시도된다.
    })
}

export async function exportBackup(data) {
  const defaultFileName = `mossy-backup-${new Date().toISOString().slice(0, 10)}.json`
  if (runningInTauri) {
    return invoke('export_backup', { data, defaultFileName })
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultFileName
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

export function importBackup() {
  if (runningInTauri) {
    return invoke('import_backup')
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve({ ok: false })
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result)
          if (!isValidData(parsed)) throw new Error('invalid shape')
          resolve({ ok: true, data: parsed })
        } catch {
          resolve({ ok: false, error: 'invalid-file' })
        }
      }
      reader.onerror = () => resolve({ ok: false, error: 'invalid-file' })
      reader.readAsText(file)
    }
    input.click()
  })
}

// 실험용 테마 에디터(tools/theme-editor.html) — 데스크톱에서는 앱 안에 새 창으로 띄우고
// (OS 기본 브라우저나 파일 경로에 의존하지 않아서 더 안정적이다), 웹 버전에서는 새 탭으로 연다.
export async function openThemeEditor() {
  if (runningInTauri) {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const existing = await WebviewWindow.getByLabel('theme-editor')
    if (existing) {
      await existing.setFocus()
      return
    }
    new WebviewWindow('theme-editor', {
      url: 'theme-editor.html',
      title: 'mossy 테마 에디터',
      width: 1200,
      height: 820,
      minWidth: 900,
      minHeight: 600
    })
    return
  }
  window.open('/theme-editor.html', '_blank')
}

export const windowControls = runningInTauri
  ? (() => {
      const appWindow = getCurrentWindow()
      return {
        minimize: () => appWindow.minimize(),
        toggleMaximize: () => appWindow.toggleMaximize(),
        close: () => appWindow.close(),
        startResizeDragging: (direction) => appWindow.startResizeDragging(direction)
      }
    })()
  : null
