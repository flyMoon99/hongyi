interface StateGridLogoProps {
  /** dark=true: 深色背景上用白色；dark=false（默认）: 浅色背景上用绿色 */
  dark?: boolean
  /** SVG 边长，默认 46 */
  size?: number
}

export function StateGridLogo({ dark = false, size = 46 }: StateGridLogoProps) {
  // dark=false (default): 用于深色/彩色背景，线条和文字为白色
  // dark=true: 用于浅色/白色背景，线条和文字为品牌绿色
  const primary   = dark ? '#007A5C' : '#ffffff'
  const secondary = dark ? 'rgba(0,122,92,0.45)' : 'rgba(255,255,255,0.5)'
  const text      = dark ? '#007A5C' : '#ffffff'
  const sub       = dark ? 'rgba(0,122,92,0.45)' : 'rgba(255,255,255,0.55)'

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="26" cy="26" r="23" stroke={primary} strokeWidth="1.8" fill="none" />
        <circle cx="26" cy="26" r="16" stroke={secondary} strokeWidth="0.8" fill="none" strokeDasharray="3 2.5" />
        <ellipse cx="26" cy="26" rx="10" ry="23" stroke={primary} strokeWidth="1.2" fill="none" />
        <line x1="3" y1="26" x2="49" y2="26" stroke={primary} strokeWidth="1" />
        <line x1="7" y1="15" x2="45" y2="15" stroke={secondary} strokeWidth="0.7" />
        <line x1="7" y1="37" x2="45" y2="37" stroke={secondary} strokeWidth="0.7" />
        <path d="M28 13 L20 27 H26.5 L23.5 39 L34 24 H27.5 Z" fill={primary} />
      </svg>
      <div>
        <div
          className="font-bold leading-tight tracking-wider"
          style={{ fontSize: 20, color: text }}
        >
          国家电网
        </div>
        <div
          className="leading-tight mt-0.5 tracking-[0.18em]"
          style={{ fontSize: 7.5, color: sub }}
        >
          STATE GRID CORPORATION OF CHINA
        </div>
      </div>
    </div>
  )
}
