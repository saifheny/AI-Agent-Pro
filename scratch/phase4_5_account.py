"""Phase 4: Redesign Account Page + Phase 5: Design Polish"""

HTML_PATH = r"c:\Users\hp zbook\Desktop\LM\index.html"

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# ===== Phase 4: Redesign Account Modal =====
old_account = """  <div class="modal-overlay" id="account-modal" onclick="UI.closeModalOutside(event,'account-modal')">
    <div class="modal full-page-mobile" >
      <div class="modal-header"
        style="border-bottom:none; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
        <button onclick="UI.closeModal('account-modal')" class="icon-btn"
          style="background:transparent; border:none;"><i data-lucide="chevron-right"
            style="width:28px;height:28px"></i></button>
        <div style="font-size:16px; font-weight:700; color:var(--text);">الملف الشخصي</div>
        <div style="width:36px;"></div> <!-- spacer -->
      </div>
      <div class="modal-body" style="padding:0 20px 40px; background:var(--bg); max-width: 480px; margin: 0 auto; width: 100%;">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="position:relative; width:80px; height:80px; margin:0 auto 12px;">
            <div id="account-avatar-display"
              style="width:100%; height:100%; border-radius:50%; background:var(--bg3); display:flex; align-items:center; justify-content:center; font-size:32px; border:2px solid rgba(255,255,255,0.1); overflow:hidden;">
              A</div>
            <div
              style="position:absolute; bottom:0; left:0; background:var(--bg2); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:2px solid var(--bg); cursor:pointer;"
              onclick="document.getElementById('avatar-upload').click()">
              <i data-lucide="pencil" style="width:12px; height:12px;"></i>
            </div>
            <input type="file" id="avatar-upload" hidden accept="image/*" onchange="Main.updateAvatar(this)">
          </div>
          <div style="font-size:18px; font-weight:800;" id="account-name-edit" contenteditable="true"
            onblur="Main.updateName(this)">المستخدم</div>
        </div>

        <div style="font-size:12px; color:var(--text3); margin-bottom:8px; padding:0 8px;">المنصة خاصتي</div>
        <div style="background:var(--bg3); border-radius:16px; overflow:hidden; margin-bottom:24px;">
          <div class="settings-row" onclick="UI.closeModal('account-modal'); UI.showModal('settings-modal');"
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:12px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div
                style="width:32px; height:32px; border-radius:8px; background:rgba(59,130,246,0.15); display:flex; align-items:center; justify-content:center; color:var(--accent);">
                <i data-lucide="settings" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:15px; font-weight:600;">تخصيص وعناصر التحكم</span>
            </div>
            <i data-lucide="chevron-left" style="width:18px; height:18px; color:var(--text3);"></i>
          </div>
          <div class="settings-row" onclick="UI.closeModal('account-modal'); UI.showModal('memory-modal');"
            style="cursor:pointer; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; padding:12px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div
                style="width:32px; height:32px; border-radius:8px; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; color:var(--red);">
                <i data-lucide="brain-circuit" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:15px; font-weight:600;">الذاكرة المخصصة</span>
            </div>
            <i data-lucide="chevron-left" style="width:18px; height:18px; color:var(--text3);"></i>
          </div>
        </div>

        <div style="font-size:12px; color:var(--text3); margin-bottom:8px; padding:0 8px;">الحساب</div>
        <div style="background:var(--bg3); border-radius:16px; overflow:hidden; margin-bottom:24px;">
          <div class="settings-row"
            style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div
                style="width:32px; height:32px; border-radius:8px; background:rgba(16,185,129,0.15); display:flex; align-items:center; justify-content:center; color:var(--green);">
                <i data-lucide="mail" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:15px; font-weight:600;">البريد الإلكتروني</span>
            </div>
            <span style="font-size:14px; color:var(--text3); cursor:pointer;" id="account-email-bot" onclick="navigator.clipboard.writeText(this.innerText); UI.toast('تم نسخ البريد الإلكتروني', 'success');"></span>
          </div>
          <div class="settings-row" onclick="UI.toggleTheme()"
            style="cursor:pointer; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; padding:12px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div
                style="width:32px; height:32px; border-radius:8px; background:rgba(245,158,11,0.15); display:flex; align-items:center; justify-content:center; color:#f59e0b;">
                <i data-lucide="sun" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:15px; font-weight:600;">المظهر</span>
            </div>
            <span style="font-size:14px; color:var(--text3);" id="theme-text">تغيير</span>
          </div>
        </div>

        <button class="settings-row" id="dynamic-logout-btn"
          style="background:var(--bg3); border-radius:16px; width:100%; color:var(--red); font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; border:none; cursor:pointer; padding:16px;"
          onclick="Main.handleLogoutClick()">
          <i data-lucide="log-out" style="width:20px; height:20px;"></i>
          تسجيل الخروج
        </button>
      </div>
    </div>
  </div>"""

new_account = """  <div class="modal-overlay" id="account-modal" onclick="UI.closeModalOutside(event,'account-modal')">
    <div class="modal full-page-mobile">
      <div class="modal-header"
        style="border-bottom:none; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
        <button onclick="UI.closeModal('account-modal')" class="icon-btn"
          style="background:transparent; border:none;"><i data-lucide="chevron-right"
            style="width:28px;height:28px"></i></button>
        <div style="font-size:16px; font-weight:700; color:var(--text-primary);">الملف الشخصي</div>
        <div style="width:36px;"></div>
      </div>
      <div class="modal-body" style="padding:0 20px 40px; background:var(--bg-primary); max-width: 480px; margin: 0 auto; width: 100%;">
        
        <!-- Premium Avatar Section -->
        <div style="text-align:center; margin-bottom:28px; padding-top:8px;">
          <div style="position:relative; width:96px; height:96px; margin:0 auto 16px;">
            <div style="position:absolute; inset:-4px; border-radius:50%; background:linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b); animation: avatarGlow 3s ease-in-out infinite; opacity:0.7;"></div>
            <div id="account-avatar-display"
              style="position:relative; width:96px; height:96px; border-radius:50%; background:#111; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:800; border:3px solid #000; overflow:hidden; color:#fff; z-index:2;">
              A</div>
            <div
              style="position:absolute; bottom:2px; left:2px; background:#1a1a1a; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid #000; cursor:pointer; z-index:3; transition: transform 0.2s;"
              onclick="document.getElementById('avatar-upload').click()"
              onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              <i data-lucide="camera" style="width:13px; height:13px; color:#fff;"></i>
            </div>
            <input type="file" id="avatar-upload" hidden accept="image/*" onchange="Main.updateAvatar(this)">
          </div>
          <div style="font-size:20px; font-weight:800; color:var(--text-primary); outline:none;" id="account-name-edit" contenteditable="true"
            onblur="Main.updateName(this)">المستخدم</div>
          <div style="display:inline-flex; align-items:center; gap:6px; margin-top:8px; padding:4px 14px; background:linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15)); border:1px solid rgba(59,130,246,0.2); border-radius:20px; font-size:11px; font-weight:700; color:#60a5fa;">
            <i data-lucide="sparkles" style="width:12px;height:12px;"></i>
            AI Agent Pro
          </div>
        </div>

        <!-- Quick Stats -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:24px;">
          <div style="background:var(--bg-surface); border:1px solid var(--border-primary); border-radius:14px; padding:14px 8px; text-align:center;">
            <div style="font-size:20px; font-weight:800; color:var(--text-primary);" id="account-stat-chats">0</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; margin-top:2px;">محادثة</div>
          </div>
          <div style="background:var(--bg-surface); border:1px solid var(--border-primary); border-radius:14px; padding:14px 8px; text-align:center;">
            <div style="font-size:20px; font-weight:800; color:var(--text-primary);" id="account-stat-msgs">0</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; margin-top:2px;">رسالة</div>
          </div>
          <div style="background:var(--bg-surface); border:1px solid var(--border-primary); border-radius:14px; padding:14px 8px; text-align:center;">
            <div style="font-size:20px; font-weight:800; color:var(--text-primary);" id="account-stat-keys">0</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; margin-top:2px;">مفتاح API</div>
          </div>
        </div>

        <!-- Platform Section -->
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; padding:0 8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">المنصة</div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-primary); border-radius:16px; overflow:hidden; margin-bottom:20px;">
          <div class="settings-row" onclick="UI.closeModal('account-modal'); UI.showModal('settings-modal');"
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px 16px; transition: background 0.15s;"
            onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05)); display:flex; align-items:center; justify-content:center; color:#3b82f6;">
                <i data-lucide="sliders-horizontal" style="width:18px;height:18px;"></i>
              </div>
              <div>
                <div style="font-size:14px; font-weight:600; color:var(--text-primary);">تخصيص وعناصر التحكم</div>
                <div style="font-size:11px; color:var(--text-muted);">النماذج، الذكاء، البيانات</div>
              </div>
            </div>
            <i data-lucide="chevron-left" style="width:16px; height:16px; color:var(--text-dim);"></i>
          </div>
          <div style="height:1px; background:var(--border-primary); margin:0 16px;"></div>
          <div class="settings-row" onclick="UI.closeModal('account-modal'); UI.showModal('memory-modal');"
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px 16px; transition: background 0.15s;"
            onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05)); display:flex; align-items:center; justify-content:center; color:#a855f7;">
                <i data-lucide="brain" style="width:18px;height:18px;"></i>
              </div>
              <div>
                <div style="font-size:14px; font-weight:600; color:var(--text-primary);">الذاكرة المخصصة</div>
                <div style="font-size:11px; color:var(--text-muted);">معلومات يتذكرها AI</div>
              </div>
            </div>
            <i data-lucide="chevron-left" style="width:16px; height:16px; color:var(--text-dim);"></i>
          </div>
          <div style="height:1px; background:var(--border-primary); margin:0 16px;"></div>
          <div class="settings-row" onclick="UI.closeModal('account-modal'); UI.showModal('model-picker-modal');"
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px 16px; transition: background 0.15s;"
            onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); display:flex; align-items:center; justify-content:center; color:#10b981;">
                <i data-lucide="cpu" style="width:18px;height:18px;"></i>
              </div>
              <div>
                <div style="font-size:14px; font-weight:600; color:var(--text-primary);">النماذج والشركات</div>
                <div style="font-size:11px; color:var(--text-muted);">اختر نموذج الذكاء المفضل</div>
              </div>
            </div>
            <i data-lucide="chevron-left" style="width:16px; height:16px; color:var(--text-dim);"></i>
          </div>
        </div>

        <!-- Account Section -->
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; padding:0 8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">الحساب</div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-primary); border-radius:16px; overflow:hidden; margin-bottom:20px;">
          <div class="settings-row"
            style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05)); display:flex; align-items:center; justify-content:center; color:#10b981;">
                <i data-lucide="mail" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:14px; font-weight:600; color:var(--text-primary);">البريد الإلكتروني</span>
            </div>
            <span style="font-size:13px; color:var(--text-muted); cursor:pointer; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" id="account-email-bot" onclick="navigator.clipboard.writeText(this.innerText); UI.toast('تم نسخ البريد', 'success');" title="انقر للنسخ"></span>
          </div>
          <div style="height:1px; background:var(--border-primary); margin:0 16px;"></div>
          <div class="settings-row" onclick="UI.toggleTheme()"
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px 16px; transition: background 0.15s;"
            onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05)); display:flex; align-items:center; justify-content:center; color:#f59e0b;">
                <i data-lucide="sun-moon" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:14px; font-weight:600; color:var(--text-primary);">المظهر</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:13px; color:var(--text-muted);" id="theme-text">داكن</span>
              <i data-lucide="chevron-left" style="width:16px; height:16px; color:var(--text-dim);"></i>
            </div>
          </div>
          <div style="height:1px; background:var(--border-primary); margin:0 16px;"></div>
          <div class="settings-row" onclick="UI.closeModal('account-modal'); UI.showModal('shortcuts-modal');"
            style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding:14px 16px; transition: background 0.15s;"
            onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05)); display:flex; align-items:center; justify-content:center; color:#6366f1;">
                <i data-lucide="keyboard" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:14px; font-weight:600; color:var(--text-primary);">اختصارات لوحة المفاتيح</span>
            </div>
            <i data-lucide="chevron-left" style="width:16px; height:16px; color:var(--text-dim);"></i>
          </div>
        </div>

        <!-- About Section -->
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; padding:0 8px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">حول</div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-primary); border-radius:16px; overflow:hidden; margin-bottom:24px;">
          <div style="padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05)); display:flex; align-items:center; justify-content:center; color:#ec4899;">
                <i data-lucide="info" style="width:18px;height:18px;"></i>
              </div>
              <span style="font-size:14px; font-weight:600; color:var(--text-primary);">الإصدار</span>
            </div>
            <span style="font-size:13px; color:var(--text-muted); font-family:'JetBrains Mono',monospace;">v3.0.0</span>
          </div>
        </div>

        <!-- Logout Button -->
        <button id="dynamic-logout-btn"
          style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); border-radius:16px; width:100%; color:#ef4444; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; padding:16px; font-family:inherit; transition:all 0.2s;"
          onmouseover="this.style.background='rgba(239,68,68,0.15)'" onmouseout="this.style.background='rgba(239,68,68,0.08)'"
          onclick="Main.handleLogoutClick()">
          <i data-lucide="log-out" style="width:18px; height:18px;"></i>
          تسجيل الخروج
        </button>
      </div>
    </div>
  </div>"""

html = html.replace(old_account, new_account)

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html)

print("Phase 4: Account page redesigned successfully!")

# ===== Phase 5: Add avatar glow animation to inline styles =====
# Add the animation in the <style> block in <head>
old_style_end = """    * {
      text-rendering: optimizeLegibility;
    }
  </style>"""

new_style_end = """    * {
      text-rendering: optimizeLegibility;
    }

    @keyframes avatarGlow {
      0%, 100% { opacity: 0.5; transform: rotate(0deg); }
      50% { opacity: 0.8; transform: rotate(180deg); }
    }

    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .settings-row {
      transition: background 0.15s ease;
    }
  </style>"""

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace(old_style_end, new_style_end)

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html)

print("Phase 5: Design polish animations added!")
