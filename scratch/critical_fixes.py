"""Fix light mode + account modal + critical issues"""
import re

# ===== 1. Fix style.css - add massive light mode overrides =====
CSS_PATH = r"c:\Users\hp zbook\Desktop\LM\css\style.css"
with open(CSS_PATH, 'r', encoding='utf-8') as f:
    css = f.read()

# Add comprehensive light mode at end
light_fix = """

/* ══════ COMPREHENSIVE LIGHT MODE FIX ══════ */

body.theme-light {
  background: #ffffff !important;
  color: #111111 !important;
}

body.theme-light .app {
  background: #ffffff !important;
}

body.theme-light .chat-area {
  background: #ffffff !important;
  color: #111111 !important;
}

body.theme-light .messages-container,
body.theme-light .messages {
  background: #ffffff !important;
  color: #111111 !important;
}

body.theme-light .msg-bubble {
  color: #111111 !important;
}
body.theme-light .msg-bubble.user {
  background: #f0f4ff !important;
  border: 1px solid rgba(59,130,246,0.12) !important;
  color: #111111 !important;
}
body.theme-light .msg-bubble p,
body.theme-light .msg-bubble li,
body.theme-light .msg-bubble span,
body.theme-light .msg-bubble div,
body.theme-light .msg-bubble h1,
body.theme-light .msg-bubble h2,
body.theme-light .msg-bubble h3,
body.theme-light .msg-bubble h4,
body.theme-light .msg-bubble strong,
body.theme-light .msg-bubble em {
  color: #111111 !important;
}
body.theme-light .msg-bubble code:not(.hljs) {
  background: #f3f4f6 !important;
  color: #2563eb !important;
}

body.theme-light .input-box {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.1) !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
}
body.theme-light .input-box:focus-within {
  border-color: var(--accent) !important;
  box-shadow: 0 4px 20px rgba(59,130,246,0.1) !important;
}

body.theme-light .input-inner textarea,
body.theme-light .input-inner input,
body.theme-light textarea,
body.theme-light input[type="text"] {
  color: #111111 !important;
}
body.theme-light .input-inner textarea::placeholder {
  color: #999999 !important;
}

body.theme-light .input-footer {
  background: transparent !important;
}
body.theme-light .input-footer span,
body.theme-light .input-footer div {
  color: #666666 !important;
}

body.theme-light .send-btn-white {
  background: #111111 !important;
  color: #ffffff !important;
}

body.theme-light .header,
body.theme-light .chat-header {
  background: rgba(255,255,255,0.9) !important;
  backdrop-filter: blur(20px) !important;
  border-bottom-color: rgba(0,0,0,0.06) !important;
  color: #111111 !important;
}
body.theme-light .header *,
body.theme-light .chat-header * {
  color: #111111 !important;
}

body.theme-light .nav {
  background: #f5f5f5 !important;
  border-left-color: rgba(0,0,0,0.06) !important;
}
body.theme-light .nav-btn {
  color: #666666 !important;
}
body.theme-light .nav-btn:hover {
  color: #111111 !important;
  background: rgba(0,0,0,0.05) !important;
}
body.theme-light .nav-btn.active {
  color: var(--accent) !important;
  background: rgba(59,130,246,0.08) !important;
}

body.theme-light .sidebar,
body.theme-light .tools-panel {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.06) !important;
}

body.theme-light .sidebar-header,
body.theme-light .sidebar-footer {
  border-color: rgba(0,0,0,0.06) !important;
  color: #111111 !important;
}
body.theme-light .sidebar-header *,
body.theme-light .sidebar-footer * {
  color: #111111 !important;
}

body.theme-light .chat-item {
  color: #111111 !important;
}
body.theme-light .chat-item:hover {
  background: rgba(0,0,0,0.03) !important;
}
body.theme-light .chat-item.active {
  background: rgba(59,130,246,0.06) !important;
  color: #2563eb !important;
}
body.theme-light .chat-item-title {
  color: #111111 !important;
}
body.theme-light .chat-item-preview {
  color: #666666 !important;
}

body.theme-light .modal {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.08) !important;
}
body.theme-light .modal-header {
  border-bottom-color: rgba(0,0,0,0.06) !important;
  color: #111111 !important;
}
body.theme-light .modal-header * {
  color: #111111 !important;
}
body.theme-light .modal-body {
  background: #ffffff !important;
  color: #111111 !important;
}
body.theme-light .modal-title {
  color: #111111 !important;
}

body.theme-light .welcome-screen {
  color: #111111 !important;
}
body.theme-light .welcome-title {
  color: #111111 !important;
}
body.theme-light .welcome-sub {
  color: #666666 !important;
}

body.theme-light .floating-btn {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.08) !important;
  color: #111111 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
}

body.theme-light .icon-btn {
  color: #555555 !important;
}
body.theme-light .icon-btn:hover {
  color: #111111 !important;
  background: rgba(0,0,0,0.06) !important;
}

body.theme-light .tool-card {
  background: #f7f7f8 !important;
  border-color: rgba(0,0,0,0.06) !important;
}
body.theme-light .tool-name {
  color: #111111 !important;
}
body.theme-light .tool-desc {
  color: #666666 !important;
}

body.theme-light .settings-row,
body.theme-light .settings-row span {
  color: #111111 !important;
}

body.theme-light .chat-dropdown {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.08) !important;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1) !important;
}
body.theme-light .dropdown-item {
  color: #333333 !important;
}

body.theme-light .section-title {
  color: #666666 !important;
}

body.theme-light .msg-meta {
  color: #999999 !important;
}

body.theme-light .quick-prompt {
  border-color: rgba(0,0,0,0.06) !important;
}
body.theme-light .quick-prompt-title {
  color: #111111 !important;
}
body.theme-light .quick-prompt-sub {
  color: #666666 !important;
}

body.theme-light .search-bar-panel {
  background: #f7f7f8 !important;
  border-bottom-color: rgba(0,0,0,0.06) !important;
}
body.theme-light .search-bar-inner {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.08) !important;
}
body.theme-light .search-bar-inner input {
  color: #111111 !important;
}

body.theme-light .share-panel {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.08) !important;
}

body.theme-light .model-option {
  background: #f7f7f8 !important;
  border-color: rgba(0,0,0,0.06) !important;
}
body.theme-light .model-option-name {
  color: #111111 !important;
}

body.theme-light .prompt-card-premium {
  border-color: rgba(0,0,0,0.06) !important;
}
body.theme-light .prompt-card-title {
  color: #111111 !important;
}
body.theme-light .prompt-card-desc {
  color: #666666 !important;
}

body.theme-light .bottom-sheet {
  background: #ffffff !important;
  color: #111111 !important;
}
body.theme-light .sheet-list-item {
  color: #111111 !important;
}
body.theme-light .sheet-list-title {
  color: #111111 !important;
}
body.theme-light .sheet-list-desc {
  color: #666666 !important;
}

body.theme-light .mobile-floating-controls {
  background: rgba(255,255,255,0.85) !important;
  border-color: rgba(0,0,0,0.08) !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
}
body.theme-light .mobile-floating-controls button,
body.theme-light .mobile-float-btn {
  color: #333333 !important;
}

body.theme-light .model-name-pill,
body.theme-light .in-chat-model-selector {
  background: rgba(0,0,0,0.04) !important;
  color: #333333 !important;
  border-color: rgba(0,0,0,0.08) !important;
}

body.theme-light .voice-preview-bar {
  background: #f3f4f6 !important;
  border-color: rgba(0,0,0,0.06) !important;
}

body.theme-light .editor-header-bar {
  background: #f7f7f8 !important;
  border-bottom-color: rgba(0,0,0,0.06) !important;
}

body.theme-light .network-bar {
  color: #ffffff !important;
}
"""

css += light_fix

with open(CSS_PATH, 'w', encoding='utf-8') as f:
    f.write(css)
print(f"1. Light mode CSS fix applied ({len(light_fix)} chars added)")

# ===== 2. Fix mobile.css light mode =====
MOBILE_PATH = r"c:\Users\hp zbook\Desktop\LM\css\mobile.css"
with open(MOBILE_PATH, 'r', encoding='utf-8') as f:
    mcss = f.read()

mobile_light = """

/* ══════ MOBILE LIGHT MODE FIX ══════ */
@media (max-width: 768px) {
  body.theme-light .mobile-floating-controls {
    background: rgba(255,255,255,0.88) !important;
    border: 1px solid rgba(0,0,0,0.06) !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
  }
  body.theme-light .mobile-floating-controls button {
    color: #333 !important;
  }
  body.theme-light .input-box {
    background: rgba(255,255,255,0.95) !important;
    border-top: 1px solid rgba(0,0,0,0.06) !important;
  }
  body.theme-light .sidebar {
    background: #ffffff !important;
  }
  body.theme-light .bottom-sheet {
    background: #ffffff !important;
    color: #111 !important;
  }
  body.theme-light .sheet-handle {
    background: rgba(0,0,0,0.15) !important;
  }
  body.theme-light .sheet-title {
    color: #111 !important;
  }
}
"""
mcss += mobile_light

with open(MOBILE_PATH, 'w', encoding='utf-8') as f:
    f.write(mcss)
print("2. Mobile light mode fix applied")

# ===== 3. Fix Account Modal - remove header bar, handle guest =====
HTML_PATH = r"c:\Users\hp zbook\Desktop\LM\index.html"
with open(HTML_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the modal header with minimal back button
old_header = """      <div class="modal-header"
        style="border-bottom:none; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
        <button onclick="UI.closeModal('account-modal')" class="icon-btn"
          style="background:transparent; border:none;"><i data-lucide="chevron-right"
            style="width:28px;height:28px"></i></button>
        <div style="font-size:16px; font-weight:700; color:var(--text-primary);">الملف الشخصي</div>
        <div style="width:36px;"></div>
      </div>"""

new_header = """      <div style="padding:12px 16px; display:flex; align-items:center;">
        <button onclick="UI.closeModal('account-modal')"
          style="width:36px; height:36px; border-radius:50%; background:var(--bg-surface); border:1px solid var(--border-primary); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-primary); transition:all 0.2s;"
          onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-surface)'">
          <i data-lucide="chevron-right" style="width:20px;height:20px"></i>
        </button>
      </div>"""

html = html.replace(old_header, new_header)

# Fix logout button to show login when not logged in
old_logout = """        <!-- Logout Button -->
        <button id="dynamic-logout-btn"
          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); border-radius:16px; width:100%; color:#ef4444; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; padding:16px; font-family:inherit; transition:all 0.2s;"
          onmouseover="this.style.background='rgba(239,68,68,0.15)'" onmouseout="this.style.background='rgba(239,68,68,0.08)'"
          onclick="Main.handleLogoutClick()">
          <i data-lucide="log-out" style="width:18px; height:18px;"></i>
          تسجيل الخروج
        </button>"""

new_logout = """        <!-- Auth Button - changes based on login state -->
        <button id="dynamic-logout-btn"
          style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.15); border-radius:16px; width:100%; color:#3b82f6; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; padding:16px; font-family:inherit; transition:all 0.2s;"
          onclick="Main.handleLogoutClick()">
          <i data-lucide="log-in" style="width:18px; height:18px;"></i>
          تسجيل الدخول
        </button>"""

html = html.replace(old_logout, new_logout)

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print("3. Account modal fixed (header + auth button)")

# ===== 4. Fix UI.js to update auth button state =====
UI_PATH = r"c:\Users\hp zbook\Desktop\LM\js\ui.js"
with open(UI_PATH, 'r', encoding='utf-8') as f:
    uijs = f.read()

# Add auth state check to updateAccountStats
old_stats_end = """      // Update theme text
      const themeText = document.getElementById('theme-text');
      if (themeText) themeText.textContent = this.theme === 'dark' ? 'داكن' : 'فاتح';
    } catch(e) { console.warn('Stats update error:', e); }
  },"""

new_stats_end = """      // Update theme text
      const themeText = document.getElementById('theme-text');
      if (themeText) themeText.textContent = this.theme === 'dark' ? 'داكن' : 'فاتح';

      // Update auth button based on login state
      const authBtn = document.getElementById('dynamic-logout-btn');
      if (authBtn) {
        const isLoggedIn = typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser;
        if (isLoggedIn) {
          authBtn.innerHTML = '<i data-lucide="log-out" style="width:18px;height:18px;"></i> تسجيل الخروج';
          authBtn.style.color = '#ef4444';
          authBtn.style.background = 'rgba(239,68,68,0.08)';
          authBtn.style.borderColor = 'rgba(239,68,68,0.15)';
        } else {
          authBtn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> تسجيل الدخول';
          authBtn.style.color = '#3b82f6';
          authBtn.style.background = 'rgba(59,130,246,0.08)';
          authBtn.style.borderColor = 'rgba(59,130,246,0.15)';
        }
        try { lucide.createIcons(); } catch(e) {}
      }
    } catch(e) { console.warn('Stats update error:', e); }
  },"""

uijs = uijs.replace(old_stats_end, new_stats_end)

with open(UI_PATH, 'w', encoding='utf-8') as f:
    f.write(uijs)
print("4. UI.js auth state logic added")

print("\nAll critical fixes applied!")
