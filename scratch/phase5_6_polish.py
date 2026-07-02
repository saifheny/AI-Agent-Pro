"""Phase 5 continued: CSS design polish + Phase 6: Light mode improvements"""

CSS_PATH = r"c:\Users\hp zbook\Desktop\LM\css\style.css"

with open(CSS_PATH, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Improve nav-btn hover with glow
css = css.replace(
    """.nav-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}""",
    """.nav-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.03);
}"""
)

# 2. Improve nav-btn active with better glow
css = css.replace(
    """.nav-btn.active {
  color: var(--accent);
  background: rgba(59, 130, 246, 0.1);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
}""",
    """.nav-btn.active {
  color: var(--accent);
  background: rgba(59, 130, 246, 0.12);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), inset 0 0 0 1px rgba(59, 130, 246, 0.15);
}"""
)

# 3. Improve nav-logo glow
css = css.replace(
    """.nav-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent3));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}""",
    """.nav-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent3));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.15);
  transition: transform 0.3s, box-shadow 0.3s;
}
.nav-logo:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(139, 92, 246, 0.2);
}"""
)

# 4. Improve input-box focus with gradient border
css = css.replace(
    """.input-box:focus-within {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--accent);
}""",
    """.input-box:focus-within {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--accent), 0 0 30px rgba(59, 130, 246, 0.08);
}"""
)

# 5. Improve send button
css = css.replace(
    """.send-btn-white {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  color: #000;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(255, 255, 255, 0.15);
}""",
    """.send-btn-white {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  color: #000000;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(255, 255, 255, 0.2);
}"""
)

# 6. Improve welcome icon
css = css.replace(
    """.welcome-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.15);
}""",
    """.welcome-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.15), 0 0 80px rgba(59, 130, 246, 0.08);
  animation: welcomePulse 3s ease-in-out infinite;
}
@keyframes welcomePulse {
  0%, 100% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.15), 0 0 80px rgba(59, 130, 246, 0.08); }
  50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.25), 0 0 100px rgba(59, 130, 246, 0.12); }
}"""
)

# 7. Improve quick-prompt cards
css = css.replace(
    """.quick-prompt:hover {
  transform: scale(0.97);
  filter: brightness(1.1);
}""",
    """.quick-prompt:hover {
  transform: scale(0.97);
  filter: brightness(1.15);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}"""
)

# 8. Improve user bubble
css = css.replace(
    """.theme-dark .msg-bubble.user {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03);
}""",
    """.theme-dark .msg-bubble.user {
  background: linear-gradient(135deg, #141414, #1a1a1a) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
}"""
)

# 9. Improve typing indicator
css = css.replace(
    """.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  width: fit-content;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease;
}""",
    """.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  width: fit-content;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
}"""
)

# 10. Improve chat-item hover
css = css.replace(
    """.chat-item:hover {
  background: var(--bg-surface);
  transform: translateX(-4px);
}""",
    """.chat-item:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateX(-4px);
}"""
)

# ===== PHASE 6: Comprehensive Light Mode =====
# Add comprehensive light mode overrides at the end
light_mode_css = """

/* ═══════════════════════════════════════════════════ */
/* PHASE 6: Comprehensive Light Mode Overrides        */
/* ═══════════════════════════════════════════════════ */

body.theme-light {
  background-color: #ffffff;
}

body.theme-light .nav {
  background: #f7f7f8;
  border-left-color: rgba(0, 0, 0, 0.06);
  box-shadow: -1px 0 4px rgba(0, 0, 0, 0.03);
}

body.theme-light .nav-btn {
  color: #666666;
  background: transparent;
}
body.theme-light .nav-btn:hover {
  color: #111111;
  background: rgba(0, 0, 0, 0.05);
}
body.theme-light .nav-btn.active {
  color: var(--accent);
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1);
}

body.theme-light .nav-logo {
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
}

body.theme-light .nav-avatar {
  border-color: rgba(0, 0, 0, 0.08);
}
body.theme-light .nav-avatar::after {
  border-color: #f7f7f8;
}

body.theme-light .sidebar,
body.theme-light .tools-panel {
  background: rgba(255, 255, 255, 0.97);
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

body.theme-light .chat-item {
  color: #111111;
}
body.theme-light .chat-item:hover {
  background: rgba(0, 0, 0, 0.03);
}
body.theme-light .chat-item.active {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

body.theme-light .chat-dropdown {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}
body.theme-light .dropdown-item {
  color: #333333;
}
body.theme-light .dropdown-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #111111;
}

body.theme-light .input-box {
  background: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06) !important;
}
body.theme-light .input-box:focus-within {
  border-color: var(--accent) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--accent) !important;
}

body.theme-light .send-btn-white {
  background: #111111;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
body.theme-light .send-btn-white:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

body.theme-light .msg-bubble.user {
  background: #f0f4ff !important;
  border-color: rgba(59, 130, 246, 0.12) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
}

body.theme-light .msg-bubble code:not(.hljs) {
  background: #f3f4f6;
  color: #2563eb;
}

body.theme-light .modal {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
}
body.theme-light .modal-header {
  border-bottom-color: rgba(0, 0, 0, 0.06);
}
body.theme-light .modal-footer {
  background: #f7f7f8;
  border-top-color: rgba(0, 0, 0, 0.06);
}

body.theme-light .settings-tab {
  color: #666666;
}
body.theme-light .settings-tab:hover {
  color: #111111;
  background: rgba(0, 0, 0, 0.03);
}
body.theme-light .settings-tab.active {
  color: var(--accent);
  background: rgba(59, 130, 246, 0.04);
}

body.theme-light .settings-input,
body.theme-light .settings-select {
  background: #f7f7f8;
  border-color: rgba(0, 0, 0, 0.08);
  color: #111111;
}

body.theme-light .settings-card {
  background: #f7f7f8;
  border-color: rgba(0, 0, 0, 0.06);
}

body.theme-light .icon-btn {
  background: rgba(0, 0, 0, 0.04);
  color: #666666;
}
body.theme-light .icon-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #111111;
}

body.theme-light .toast {
  background: rgba(255, 255, 255, 0.97);
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  color: #111111;
}

body.theme-light .typing-indicator {
  background: #f7f7f8;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

body.theme-light .scroll-bottom-btn {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  color: #111111;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

body.theme-light .cmd-palette-box {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.12);
}
body.theme-light .cmd-palette-input {
  background: #f7f7f8;
  border-bottom-color: rgba(0, 0, 0, 0.06);
  color: #111111;
}
body.theme-light .cmd-palette-item:hover,
body.theme-light .cmd-palette-item.active {
  background: rgba(59, 130, 246, 0.06);
}

body.theme-light .quick-prompt {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

body.theme-light .in-chat-model-selector {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: #333333;
}
body.theme-light .in-chat-model-selector:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: var(--accent);
}

body.theme-light .api-key-item {
  background: #f7f7f8;
  border-color: rgba(0, 0, 0, 0.06);
  color: #333333;
}

body.theme-light .company-card {
  background: #f7f7f8 !important;
  border-color: rgba(0, 0, 0, 0.06) !important;
}

body.theme-light .premium-link-btn {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
body.theme-light .premium-link-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

body.theme-light .voice-msg-player {
  background: #f7f7f8;
  border-color: rgba(0, 0, 0, 0.06);
}

body.theme-light .msg-action-btn {
  color: #999;
}
body.theme-light .msg-action-btn:hover {
  color: #333;
  background: rgba(0,0,0,0.05);
}

body.theme-light .badge-green {
  background: rgba(16, 185, 129, 0.1);
}
body.theme-light .badge-purple {
  background: rgba(139, 92, 246, 0.1);
}

body.theme-light ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
}
body.theme-light ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
"""

css += light_mode_css

with open(CSS_PATH, 'w', encoding='utf-8') as f:
    f.write(css)

print("Phase 5+6 complete: Design polish + Light mode overrides applied!")
print(f"  Final CSS size: {len(css)} bytes")
