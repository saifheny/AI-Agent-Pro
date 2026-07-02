"""Phase 1: New color system, missing variables, CSS fixes"""
import re

CSS_PATH = r"c:\Users\hp zbook\Desktop\LM\css\style.css"

with open(CSS_PATH, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Replace :root block with new comprehensive variables
old_root = """:root {
  /* Core Colors - Dark Mode Default */
  --bg-primary: #030712;
  --bg-secondary: #09090b;
  --bg-surface: #111827;
  --bg-panel: rgba(3, 7, 18, 0.85);
  --bg-input: #0f172a;
  
  --text-primary: #ffffff;
  --text-secondary: #e2e8f0;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  
  --icon-primary: #ffffff;
  --icon-secondary: #94a3b8;
  
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.05);
  
  --accent: #3b82f6;
  --accent-glow: rgba(59, 130, 246, 0.4);
  --accent-secondary: #8b5cf6;
  --accent-tertiary: #d946ef;
  --accent2: var(--accent-secondary);
  --accent3: var(--accent-tertiary);
  --accent-contrast: #ffffff;
  
  --user-bubble-bg: #1e293b;
  --user-bubble-border: rgba(255, 255, 255, 0.12);
  --ai-bubble-bg: transparent;
  
  /* Sidebar & Layout */
  --sidebar-w: 300px;
  --nav-w: 72px;
  --header-h: 64px;
  
  /* Radii & Shadows */
  --radius-xl: 32px;
  --radius-lg: 20px;
  --radius-md: 14px;
  --radius-sm: 8px;
  --shadow-premium: 0 25px 60px -12px rgba(0, 0, 0, 0.6);
  
  /* Transitions */
  --transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Fonts */
  --font-primary: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Status Colors */
  --green: #10b981;
  --red: #ef4444;
  --yellow: #f59e0b;
  --blue: #3b82f6;
}"""

new_root = """:root {
  /* Core Colors - Dark Mode Default */
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-surface: #111111;
  --bg-elevated: #1a1a1a;
  --bg-panel: rgba(0, 0, 0, 0.88);
  --bg-input: #0d0d0d;
  --bg-hover: rgba(255, 255, 255, 0.06);
  
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #888888;
  --text-dim: #555555;
  
  --icon-primary: #ffffff;
  --icon-secondary: #aaaaaa;
  
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-secondary: rgba(255, 255, 255, 0.04);
  --border-glow: rgba(255, 255, 255, 0.15);
  
  --accent: #3b82f6;
  --accent-glow: rgba(59, 130, 246, 0.4);
  --accent-secondary: #8b5cf6;
  --accent-tertiary: #d946ef;
  --accent2: var(--accent-secondary);
  --accent3: var(--accent-tertiary);
  --accent-contrast: #ffffff;
  --accent-hover: #2563eb;
  
  --user-bubble-bg: #141414;
  --user-bubble-border: rgba(255, 255, 255, 0.08);
  --ai-bubble-bg: transparent;
  
  /* Backward compatibility aliases */
  --bg: var(--bg-primary);
  --bg2: var(--bg-secondary);
  --bg3: var(--bg-surface);
  --text: var(--text-primary);
  --text2: var(--text-secondary);
  --text3: var(--text-muted);
  --border: var(--border-primary);
  --cyan: #06b6d4;
  --pink: #ec4899;
  --indigo: #6366f1;
  
  /* Sidebar & Layout */
  --sidebar-w: 300px;
  --nav-w: 72px;
  --header-h: 64px;
  
  /* Radii & Shadows */
  --radius-xl: 32px;
  --radius-lg: 20px;
  --radius-md: 14px;
  --radius-sm: 8px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
  --shadow-premium: 0 25px 60px -12px rgba(0, 0, 0, 0.8);
  --shadow-glow: 0 0 30px rgba(59, 130, 246, 0.15);
  
  /* Transitions */
  --transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Fonts */
  --font-primary: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Status Colors */
  --green: #10b981;
  --red: #ef4444;
  --yellow: #f59e0b;
  --blue: #3b82f6;
}"""

css = css.replace(old_root, new_root)

# 2. Replace theme-dark block
old_dark = """body.theme-dark {
  --bg-primary: #030712;
  --bg-secondary: #09090b;
  --bg-surface: #111827;
  --bg-panel: rgba(3, 7, 18, 0.85);
  --text-primary: #ffffff;
  --text-secondary: #f1f5f9;
  --text-muted: #94a3b8;
  --icon-primary: #ffffff;
  --border-primary: rgba(255, 255, 255, 0.1);
  --user-bubble-bg: #1e293b;
}"""

new_dark = """body.theme-dark {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-surface: #111111;
  --bg-elevated: #1a1a1a;
  --bg-panel: rgba(0, 0, 0, 0.88);
  --bg-input: #0d0d0d;
  --bg-hover: rgba(255, 255, 255, 0.06);
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #888888;
  --text-dim: #555555;
  --icon-primary: #ffffff;
  --icon-secondary: #aaaaaa;
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-secondary: rgba(255, 255, 255, 0.04);
  --user-bubble-bg: #141414;
  --user-bubble-border: rgba(255, 255, 255, 0.08);
  --shadow-premium: 0 25px 60px -12px rgba(0, 0, 0, 0.8);
}"""

css = css.replace(old_dark, new_dark)

# 3. Replace theme-light block
old_light = """body.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-surface: #ffffff;
  --bg-panel: rgba(255, 255, 255, 0.9);
  --bg-input: #f1f5f9;
  
  --text-primary: #000000;
  --text-secondary: #0f172a;
  --text-muted: #475569;
  --text-dim: #64748b;
  
  --icon-primary: #000000;
  --icon-secondary: #475569;
  
  --border-primary: rgba(0, 0, 0, 0.1);
  --border-secondary: rgba(0, 0, 0, 0.05);
  
  --user-bubble-bg: #eff6ff;
  --user-bubble-border: rgba(37, 99, 235, 0.15);
  --ai-bubble-bg: transparent;
  
  --shadow-premium: 0 10px 40px rgba(0, 0, 0, 0.08);
}"""

new_light = """body.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f7f8;
  --bg-surface: #ffffff;
  --bg-elevated: #f0f0f2;
  --bg-panel: rgba(255, 255, 255, 0.95);
  --bg-input: #f3f4f6;
  --bg-hover: rgba(0, 0, 0, 0.04);
  
  --text-primary: #111111;
  --text-secondary: #333333;
  --text-muted: #666666;
  --text-dim: #999999;
  
  --icon-primary: #111111;
  --icon-secondary: #555555;
  
  --border-primary: rgba(0, 0, 0, 0.08);
  --border-secondary: rgba(0, 0, 0, 0.04);
  --border-glow: rgba(0, 0, 0, 0.12);
  
  --user-bubble-bg: #f0f4ff;
  --user-bubble-border: rgba(37, 99, 235, 0.12);
  --ai-bubble-bg: transparent;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.1);
  --shadow-premium: 0 8px 30px rgba(0, 0, 0, 0.06);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.08);
}"""

css = css.replace(old_light, new_light)

# 4. Fix orphaned CSS at line ~638
css = css.replace("""  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 24px;
}
.chat-item-preview {""", """.chat-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 24px;
}
.chat-item-preview {""")

# 5. Fix theme-color for true black
css = css.replace(
    "const themeColor = name === 'dark' ? '#030712' : '#ffffff';",
    "const themeColor = name === 'dark' ? '#000000' : '#ffffff';"
)

# 6. Improve nav background
css = css.replace(
    """.nav {
  width: var(--nav-w);
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-primary);""",
    """.nav {
  width: var(--nav-w);
  background: #000000;
  border-left: 1px solid rgba(255, 255, 255, 0.06);"""
)

# 7. Improve sidebar background
css = css.replace(
    """.sidebar,
.tools-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--bg-secondary);""",
    """.sidebar,
.tools-panel {
  width: 320px;
  flex-shrink: 0;
  background: #050505;"""
)

# 8. Improve input-box for dark mode
css = css.replace(
    """.input-box {
  pointer-events: auto;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-premium);""",
    """.input-box {
  pointer-events: auto;
  background: #0e0e0e;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);"""
)

# 9. Improve chat-dropdown for dark
css = css.replace(
    """.chat-dropdown {
  position: absolute;
  left: 10px;
  top: 40px;
  background: #1a1a1a;""",
    """.chat-dropdown {
  position: absolute;
  left: 10px;
  top: 40px;
  background: #111111;"""
)

# 10. Improve modal background
css = css.replace(
    """.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05);""",
    """.modal {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.04);"""
)

with open(CSS_PATH, 'w', encoding='utf-8') as f:
    f.write(css)

print("Phase 1 complete: Color system updated")
print(f"  File size: {len(css)} bytes")
