css_additions = """
/* Settings Fullscreen UI Fix */
.fullscreen-api-ui .modal-body {
  max-width: 800px !important;
  margin: 0 auto !important;
  width: 100% !important;
}
.fullscreen-api-ui .modal-header {
  max-width: 800px !important;
  margin: 0 auto !important;
  width: 100% !important;
  border-bottom: 1px solid rgba(255,255,255,0.05) !important;
}

/* User Messages Transparent Bubble with Divider */
.msg-bubble.user:not(.transparent-bubble) {
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 16px !important;
  box-shadow: none !important;
}
.msg-wrap {
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  margin-bottom: 12px;
  padding-bottom: 12px;
}
.msg-wrap:last-child {
  border-bottom: none;
}

/* Image Grid (WhatsApp Style) */
.image-grid {
  display: grid;
  gap: 4px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  max-width: 320px;
}
.image-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  display: block;
}
.image-grid.count-1 {
  grid-template-columns: 1fr;
}
.image-grid.count-2 {
  grid-template-columns: 1fr 1fr;
}
.image-grid.count-2 img {
  aspect-ratio: 1 / 1;
}
.image-grid.count-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.image-grid.count-3 img:first-child {
  grid-row: span 2;
  height: 100%;
}
.image-grid.count-3 img {
  aspect-ratio: 1 / 1;
}
.image-grid.count-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.image-grid.count-4 img {
  aspect-ratio: 1 / 1;
}

/* Text formatting fixes */
.msg-content-wrapper {
  direction: auto;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Like/Dislike Active State */
.msg-action-btn.active {
  color: var(--accent) !important;
  background: rgba(var(--accent-rgb, 59, 130, 246), 0.1) !important;
}
.msg-action-btn.active.dislike {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
}
"""

with open('css/style.css', 'a', encoding='utf-8') as f:
    f.write(css_additions)

print("Added CSS additions.")
