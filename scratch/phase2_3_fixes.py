"""Phase 2+3: Fix sidebar on mobile + fix broken references in HTML"""

# ===== PART A: Fix HTML broken references =====
HTML_PATH = r"c:\Users\hp zbook\Desktop\LM\index.html"

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Fix bottom sheet file-upload → file-input
html = html.replace(
    "document.getElementById('file-upload').click()",
    "document.getElementById('file-input').click()"
)

# 2. Fix bottom sheet image-upload → image-capture-input  
html = html.replace(
    "document.getElementById('image-upload').click()",
    "document.getElementById('image-capture-input').click()"
)

# 3. Fix theme-color meta for true black
html = html.replace(
    '<meta name="theme-color" content="#000000">',
    '<meta name="theme-color" content="#000000">'
)

# 4. Close unclosed bottom-sheet divs (missing </div> tags)
# The bottom-sheet HTML is missing closing tags for sheet-body and sheet-list
old_sheet_end = """        <div class="sheet-list-item" onclick="UI.showModal('prompts-modal'); UI.closeBottomSheet();">
          <div class="sheet-list-icon green"><i data-lucide="library" style="width:20px;height:20px"></i></div>
          <div class="sheet-list-info">
            <div class="sheet-list-title">مكتبة الأوامر</div>
            <div class="sheet-list-desc">أوامر جاهزة للاستخدام</div>
          </div>
          <i data-lucide="chevron-left" style="width:16px;height:16px;color:var(--text3);opacity:0.5"></i>
        </div>
        

  </div>"""

new_sheet_end = """        <div class="sheet-list-item" onclick="UI.showModal('prompts-modal'); UI.closeBottomSheet();">
          <div class="sheet-list-icon green"><i data-lucide="library" style="width:20px;height:20px"></i></div>
          <div class="sheet-list-info">
            <div class="sheet-list-title">مكتبة الأوامر</div>
            <div class="sheet-list-desc">أوامر جاهزة للاستخدام</div>
          </div>
          <i data-lucide="chevron-left" style="width:16px;height:16px;color:var(--text3);opacity:0.5"></i>
        </div>
      </div> <!-- /.sheet-list -->
    </div> <!-- /.sheet-body -->
  </div> <!-- /.bottom-sheet -->"""

html = html.replace(old_sheet_end, new_sheet_end)

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html)

print("Phase 2+3 HTML fixes complete")

# ===== PART B: Fix mobile CSS for sidebar =====
MOBILE_PATH = r"c:\Users\hp zbook\Desktop\LM\css\mobile.css"

with open(MOBILE_PATH, 'r', encoding='utf-8') as f:
    mcss = f.read()

# 1. Fix sidebar mobile - ensure proper transforms and transitions
old_sidebar_mobile = """  .sidebar {
    right: 0 !important;
    left: 0 !important;
    transform: translateX(100%) !important;
  }"""

new_sidebar_mobile = """  .sidebar {
    right: 0 !important;
    left: 0 !important;
    transform: translateX(100%) !important;
    opacity: 1 !important;
    pointer-events: none !important;
  }"""

mcss = mcss.replace(old_sidebar_mobile, new_sidebar_mobile)

# 2. Fix sidebar:not(.collapsed) to properly override
old_sidebar_open = """  .sidebar:not(.collapsed) {
    transform: translateX(0) !important;
  }"""

new_sidebar_open = """  .sidebar:not(.collapsed) {
    transform: translateX(0) !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }"""

mcss = mcss.replace(old_sidebar_open, new_sidebar_open)

# 3. Fix sidebar/tools-panel base - remove opacity:0 issue
old_sidebar_base = """  .sidebar,
  .tools-panel {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
    z-index: 600 !important;
    box-shadow: none !important;
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1) !important;
    background: var(--bg-primary, #030712) !important;
    border-radius: 0 !important;
    border: none !important;
    padding-top: calc(var(--safe-top) + 16px) !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }"""

new_sidebar_base = """  .sidebar,
  .tools-panel {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
    z-index: 600 !important;
    box-shadow: none !important;
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1) !important;
    background: #000000 !important;
    border-radius: 0 !important;
    border: none !important;
    padding-top: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    opacity: 1 !important;
  }"""

mcss = mcss.replace(old_sidebar_base, new_sidebar_base)

# 4. Fix chat-list padding-top that pushes content too far down
mcss = mcss.replace(
    'padding-top: 70px;',
    'padding-top: 8px;'
)

# 5. Improve mobile input-box for true black
old_input = """  .input-box {
    pointer-events: auto;
    border-radius: 24px 24px 0 0;
    max-width: 100%;
    margin: 0;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(15, 15, 20, 0.4);
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.3);
    padding: 6px 0 0;
    transition: border-color 0.2s;
  }"""

new_input = """  .input-box {
    pointer-events: auto;
    border-radius: 24px 24px 0 0;
    max-width: 100%;
    margin: 0;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
    padding: 6px 0 0;
    transition: border-color 0.2s;
  }"""

mcss = mcss.replace(old_input, new_input)

# 6. Improve floating controls for true black
mcss = mcss.replace(
    "background: rgba(9, 9, 11, 0.7);",
    "background: rgba(0, 0, 0, 0.75);"
)
mcss = mcss.replace(
    "background: rgba(9, 9, 11, 0.65);",
    "background: rgba(0, 0, 0, 0.7);"
)

# 7. Improve mobile modal-header
mcss = mcss.replace(
    "background: rgba(10, 10, 15, 0.75) !important;",
    "background: rgba(0, 0, 0, 0.8) !important;"
)

# 8. Light mode mobile improvements
old_light_sidebar = """  body.theme-light .sidebar,
  body.theme-light .tools-panel {
    background: #f8fafc !important;
  }"""

new_light_sidebar = """  body.theme-light .sidebar,
  body.theme-light .tools-panel {
    background: #ffffff !important;
  }
  body.theme-light .input-box {
    background: rgba(255, 255, 255, 0.92) !important;
    border-top-color: rgba(0, 0, 0, 0.06) !important;
    box-shadow: 0 -6px 30px rgba(0, 0, 0, 0.05) !important;
  }"""

mcss = mcss.replace(old_light_sidebar, new_light_sidebar)

with open(MOBILE_PATH, 'w', encoding='utf-8') as f:
    f.write(mcss)

print("Phase 2+3 Mobile CSS fixes complete")

# ===== PART C: Fix UI.js theme-color =====
UI_PATH = r"c:\Users\hp zbook\Desktop\LM\js\ui.js"

with open(UI_PATH, 'r', encoding='utf-8') as f:
    uijs = f.read()

uijs = uijs.replace(
    "const themeColor = name === 'dark' ? '#030712' : '#ffffff';",
    "const themeColor = name === 'dark' ? '#000000' : '#ffffff';"
)

with open(UI_PATH, 'w', encoding='utf-8') as f:
    f.write(uijs)

print("Phase 2+3 UI.js fixes complete")
print("All Phase 2+3 fixes applied successfully!")
