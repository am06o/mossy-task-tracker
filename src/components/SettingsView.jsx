import { useRef } from 'react'
import { Download, LogOut, Palette, Plus, Upload, Wand2, X } from 'lucide-react'
import './ColorPicker.css'
import './SettingsView.css'

function ColorRow({ value, palette, onChange }) {
  const customInputRef = useRef(null)
  const isPreset = palette.some((hex) => hex.toLowerCase() === value.toLowerCase())

  return (
    <div className="settings-color-row">
      {palette.map((hex, i) => (
        <button
          key={i}
          type="button"
          className={`color-swatch ${value.toLowerCase() === hex.toLowerCase() ? 'is-active' : ''}`}
          style={{ backgroundColor: hex }}
          onClick={() => onChange(hex)}
        />
      ))}
      <button
        type="button"
        title="커스텀 색"
        className={`color-swatch color-swatch--custom ${!isPreset ? 'is-active' : ''}`}
        style={!isPreset ? { backgroundColor: value } : undefined}
        onClick={() => customInputRef.current?.click()}
      >
        {isPreset && <Plus size={12} />}
      </button>
      <input
        ref={customInputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="color-picker-native"
      />
    </div>
  )
}

function CustomCssRow({ customCss, customCssName, customCssEnabled, onImport, onToggle, onClear }) {
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onImport(String(reader.result || ''), file.name)
    reader.readAsText(file)
  }

  return (
    <div className="settings-customcss">
      <div className="settings-data-row">
        <button className="settings-action-btn" onClick={() => fileInputRef.current?.click()}>
          <Palette size={15} /> CSS 파일 가져오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".css,text/css"
          className="settings-file-input"
          onChange={handleFileChange}
        />
      </div>

      {customCss && (
        <div className="settings-customcss-active">
          <label className="settings-toggle-row">
            <span>{customCssName || '커스텀 CSS'} 적용</span>
            <input
              type="checkbox"
              className="settings-toggle"
              checked={!!customCssEnabled}
              onChange={(e) => onToggle(e.target.checked)}
            />
          </label>
          <button className="settings-customcss-clear" title="제거" onClick={onClear}>
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function SettingsView({
  themeColor,
  onChangeThemeColor,
  palette,
  onChangePaletteColor,
  darkMode,
  onChangeDarkMode,
  customCss,
  customCssName,
  customCssEnabled,
  onImportCustomCss,
  onToggleCustomCss,
  onClearCustomCss,
  onOpenThemeEditor,
  onExport,
  onImport,
  account,
  onSignOut
}) {
  return (
    <main className="settings-view">
      <header className="settings-view-header">
        <h1>설정</h1>
      </header>

      <section className="settings-block">
        <h2>화면</h2>
        <label className="settings-toggle-row">
          <span>다크 모드</span>
          <input
            type="checkbox"
            className="settings-toggle"
            checked={!!darkMode}
            onChange={(e) => onChangeDarkMode(e.target.checked)}
          />
        </label>
      </section>

      <section className="settings-block">
        <h2>테마 색상</h2>
        <ColorRow value={themeColor} palette={palette} onChange={onChangeThemeColor} />
      </section>

      <section className="settings-block">
        <h2>색상 팔레트</h2>
        <div className="settings-palette-row">
          {palette.map((hex, i) => (
            <label key={i} className="settings-palette-swatch" style={{ backgroundColor: hex }}>
              <input
                type="color"
                value={hex}
                onChange={(e) => onChangePaletteColor(i, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <h2>꾸미기</h2>
        <p className="settings-block-desc">
          CSS 파일을 가져오면 색·글꼴·배치를 원하는 대로 바꿀 수 있어요.
        </p>
        <CustomCssRow
          customCss={customCss}
          customCssName={customCssName}
          customCssEnabled={customCssEnabled}
          onImport={onImportCustomCss}
          onToggle={onToggleCustomCss}
          onClear={onClearCustomCss}
        />
        <div className="settings-data-row" style={{ marginTop: 8 }}>
          <button className="settings-action-btn" onClick={onOpenThemeEditor}>
            <Wand2 size={15} /> 테마 에디터 열기
          </button>
        </div>
      </section>

      <section className="settings-block">
        <h2>데이터</h2>
        <div className="settings-data-row">
          <button className="settings-action-btn" onClick={onExport}>
            <Upload size={15} /> 데이터 내보내기
          </button>
          <button className="settings-action-btn" onClick={onImport}>
            <Download size={15} /> 데이터 불러오기
          </button>
        </div>
      </section>

      {account && (
        <section className="settings-block">
          <h2>계정</h2>
          <div className="settings-data-row">
            <span className="settings-account-email">{account}</span>
            <button className="settings-action-btn" onClick={onSignOut}>
              <LogOut size={15} /> 로그아웃
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
