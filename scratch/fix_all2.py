"""
Fix #2: Comprehensive mobile overlap fix + desktop sidebar visibility.
Issues:
1. Mobile: floating controls (new chat, incognito, model, menu) overlap each other
2. Mobile: sidebar design is ugly
3. Desktop: sidebar not visible (no toggle button after nav removal)
"""


with open(r'c:\Users\hp zbook\Desktop\LM\css\mobile.css', 'r', encoding='utf-8', errors='replace') as f:
    mobile_css = f.read()

mobile_css = mobile_css.replace('\x00', '')


floating_controls_css = """
  /* Floating Top Controls - proper flex row */
  .floating-top-controls {
    position: fixed !important;
    top: calc(var(--safe-top) + 10px);
    left: 14px;
    right: 14px;
    z-index: 600;
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    gap: 8px;
  }
  .floating-top-controls > * {
    pointer-events: auto;
  }
  .floating-top-controls .float-btn {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(9, 9, 11, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }
  .floating-top-controls .float-btn:active {
    transform: scale(0.88);
    background: rgba(255, 255, 255, 0.12);
  }
  .floating-top-controls .float-model {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    transform: none !important;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 16px;
    background: rgba(9, 9, 11, 0.65);
    backdrop-filter: blur(28px) saturate(200%);
    -webkit-backdrop-filter: blur(28px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 50px;
    cursor: pointer;
    z-index: 501;
    font-size: 13px;
    font-weight: 800;
    color: var(--text);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: none;
  }
  .floating-top-controls .float-model:active {
    transform: scale(0.95) !important;
    background: rgba(255, 255, 255, 0.1);
  }
  .floating-top-controls .mobile-float-btn {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(9, 9, 11, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    flex-shrink: 0;
  }
  .floating-top-controls .mobile-float-btn:active {
    transform: scale(0.88);
    background: rgba(255, 255, 255, 0.12);
  }
"""
.

mobile_css += "\n\n" + "@media (max-width: 1023px) {\n" + floating_controls_css + "\n}\n"

with open(r'c:\Users\hp zbook\Desktop\LM\css\mobile.css', 'w', encoding='utf-8') as f:
    f.write(mobile_css)

print("[OK] mobile.css - floating controls fixed")


with open(r'c:\Users\hp zbook\Desktop\LM\css\style.css', 'r', encoding='utf-8', errors='replace') as f:
    css = f.read()

css = css.replace('\x00', '')

old_collapsed = """  .sidebar.collapsed {
    width: 0 !important;
    min-width: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    border-left: none !important;
    padding: 0 !important;
  }"""

new_collapsed = """  .sidebar.collapsed {
    width: 280px !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    border-left: 1px solid var(--border) !important;
  }"""

css = css.replace(old_collapsed, new_collapsed)

with open(r'c:\Users\hp zbook\Desktop\LM\css\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("[OK] style.css - desktop sidebar always visible")


with open(r'c:\Users\hp zbook\Desktop\LM\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    'onclick="UI.toggleSidebar()" class="icon-btn mobile-only"',
    'onclick="UI.toggleSidebar()" class="icon-btn sidebar-close-btn"'
)

with open(r'c:\Users\hp zbook\Desktop\LM\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("[OK] index.html - sidebar close button now visible on all devices")
print("\n[DONE] All fixes applied!")
