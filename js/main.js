const Main = {
  chats: [],
  currentChatId: null,
  messages: [],
  uploadedFiles: [],
  currentModel: 'free-gpt4o',
  currentMode: 'general',
  isLoading: false,
  pendingRequests: [],
  totalStorage: 0,
  stats: { msgs: 0, chats: 0, tokens: 0 },
  systemPrompts: {
    general: 'أنت مساعد ذكاء اصطناعي احترافي (AI Agent Pro). أجب بالعربية الفصحى أو العامية حسب سياق المستخدم. تحدث كأنك خبير أو عالم حسب ما يفضله المستخدم. إذا طلب المستخدم توليد صورة أو رسم أو تخيل شيء، قم بترجمة طلبه إلى الإنجليزية بدقة عالية، ثم قم بالرد بالتنسيق التالي فقط: [IMAGE: English detailed description of the image]. يجب أن يكون الوصف الإنجليزي مفصلاً (مثلاً: "High quality, 8k resolution, cinematic lighting...") لضمان أفضل نتيجة عبر Pollinations.ai. لا تكتب أي نص إضافي بجانب التنسيق إلا إذا لزم الأمر.',
    code: 'أنت مهندس برمجيات كبير داخل منصة AI Agent Pro. عند طلب موقع أو تطبيق: قدّم حلاً عملياً واستخدم HTML/CSS/JS. إذا طلب تعديل إعدادات المنصة، اشرح له ببساطة كيف يفتح قائمة الإعدادات (Settings) ويضيف مفاتيح الـ API أو يغير الثيم.',
    translate: 'أنت مترجم عربي محترف. ترجم بدقة مع الحفاظ على المعنى والنبرة والسياق، واشرح المصطلحات التقنية أو الثقافية عند الحاجة.',
    creative: 'أنت مساعد إبداعي للكتابة والأفكار. اقترح نصوصاً وأفكاراً منظمة، جذابة، وقابلة للتنفيذ، مع الحفاظ على وضوح اللغة العربية.',
    analyze: 'أنت محلل بيانات ومعلومات. لخص الأنماط والنتائج المهمة، واذكر الافتراضات بوضوح، وقدّم توصيات عملية مبنية على الأدلة المتاحة.'
  },
  videoDownloads: {},
  shouldUseDeepThinking(text) {
    const value = String(text || '').toLowerCase();
    const complexSignals = [
      'حلل', 'تحليل', 'خطة', 'استراتيجية', 'قارن', 'مقارنة', 'استنتج', 'برهن', 'خوارزم',
      'debug', 'architecture', 'refactor', 'research', 'analyze', 'compare', 'reason', 'proof',
      'step by step', 'deep', 'complex', 'algorithm', 'security', 'database schema'
    ];
    const active = Object.values(this.ALL_MODELS || {})
      .flatMap(provider => provider.models || [])
      .find(model => model.id === this.currentModel);
    return Boolean(
      active?.reasoning ||
      this.currentMode === 'analyze' ||
      this.currentMode === 'code' ||
      value.length > 550 ||
      complexSignals.some(signal => value.includes(signal))
    );
  },
  formatMediaTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const secs = String(total % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
  },
  setMode(mode) {
    const aliases = { coding: 'code', analysis: 'analyze' };
    mode = aliases[mode] || mode || 'general';
    this.currentMode = mode;
    const labels = {
      general: ['المحادثة العادية', 'message-square'], 'web-search': ['بحث الإنترنت', 'globe-2'],
      code: ['البرمجة', 'code-2'], translate: ['الترجمة', 'languages'],
      analyze: ['التحليل', 'chart-no-axes-combined'], creative: ['الإبداع', 'pen-tool']
    };
    const [label, icon] = labels[mode] || labels.general;
    const container = document.getElementById('active-modes-container');
    if (container) {
      container.style.display = mode === 'general' ? 'none' : 'flex';
      container.innerHTML = mode === 'general' ? '' : `<div class="active-mode-chip mode-${mode}"><i data-lucide="${icon}"></i><span>${label}</span><div onclick="Main.setMode('general')" style="cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding: 4px; border-radius: 50%;"><i data-lucide="x" class="chip-close"></i></div></div>`;
    }
    const webToggle = document.getElementById('web-search-toggle');
    const webButton = document.getElementById('web-search-btn');
    if (webToggle) webToggle.checked = mode === 'web-search';
    if (webButton) webButton.classList.toggle('active', mode === 'web-search');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('nav-' + (mode === 'code' ? 'coding' : mode))?.classList.add('active');
    const input = document.getElementById('chat-input');
    if (input) input.placeholder = mode === 'general' ? 'اسأل AI Agent Pro...' : `وضع ${label} مفعّل — اكتب طلبك...`;
    try { lucide.createIcons(); } catch (e) {}
  },
  applyQuickAction(action) {
    const options = {
      research: { mode: 'web-search', text: 'ابحث في مصادر موثوقة ومفتوحة عن: ' },
      brainstorm: { mode: 'creative', text: 'ساعدني على توليد أفكار جديدة حول: ' },
      analyze: { mode: 'analyze', text: 'حلّل هذا بوضوح مع توصيات عملية: ' },
      translate: { mode: 'translate', text: 'ترجم النص التالي مع الحفاظ على المعنى والنبرة: ' }
    };
    const selected = options[action];
    if (!selected) return;
    this.setMode(selected.mode);
    const input = document.getElementById('chat-input');
    if (!input) return;
    if (!input.value.trim()) input.value = selected.text;
    input.focus();
    input.dispatchEvent(new Event('input'));
  },
  getIdentityPrompt() {
    let modelName = this.currentModel;
    let providerName = 'the configured provider';
    let modelMaker = '';
    for (const [provider, data] of Object.entries(this.ALL_MODELS)) {
      const model = data.models.find(item => item.id === this.currentModel);
      if (model) {
        modelName = model.name;
        providerName = data.name;
        modelMaker = ({
          openai: 'OpenAI', gemini: 'Google', anthropic: 'Anthropic', deepseek: 'DeepSeek',
          xai: 'xAI', perplexity: 'Perplexity', local: 'the local model publisher', pollinations: 'the model publisher exposed by Pollinations'
        })[provider] || '';
        if (provider === 'groq' && model.name.toLowerCase().includes('llama')) modelMaker = 'Meta';
        if (provider === 'groq' && model.name.toLowerCase().includes('mixtral')) modelMaker = 'Mistral AI';
        if (provider === 'local' && model.name.toLowerCase().includes('llama')) modelMaker = 'Meta';
        if (provider === 'local' && model.name.toLowerCase().includes('qwen')) modelMaker = 'Alibaba Cloud';
        if (provider === 'pollinations' && model.name.toLowerCase().includes('llama')) modelMaker = 'Meta';
        if (provider === 'pollinations' && model.name.toLowerCase().includes('mistral')) modelMaker = 'Mistral AI';
        break;
      }
    }
    if (this.currentModel === 'default-pro') {
      modelName = 'Llama 3.3 70B';
      modelMaker = 'Meta';
      providerName = 'Groq';
    }
    return `Identity policy: the active model selection is "${modelName}". Its model maker is "${modelMaker || 'the configured model publisher'}" and its serving provider is "${providerName}". If the user asks who created you, who owns the model, or which model is answering, state these facts accurately. Clearly distinguish the model maker and serving provider from AI Agent Pro. AI Agent Pro is the platform/tool affiliated with SA that enables this experience; do not claim SA created a third-party model. Answer this identity question in the same language used by the user.`;
  },
  queueMessage() {
    const input = document.getElementById('chat-input');
    const text = input?.value.trim() || '';
    if (!text && !this.uploadedFiles.length && !this.pendingVoiceBlob) return false;
    const webToggle = document.getElementById('web-search-toggle');
    this.pendingRequests.push({
      text,
      files: this.uploadedFiles.map(file => ({ ...file })),
      voiceBlob: this.pendingVoiceBlob || null,
      mode: this.currentMode,
      webSearch: Boolean(webToggle?.checked)
    });
    this.uploadedFiles = [];
    this.pendingVoiceBlob = null;
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    this.saveDraft('');
    this.renderAttachments();
    UI.toast('تمت إضافة رسالتك إلى قائمة الإرسال', 'info');
    return true;
  },
  setResponseState(isBusy) {
    this.isLoading = isBusy;
    document.body.classList.toggle('assistant-busy', isBusy);
    const sendButton = document.getElementById('send-btn');
    const input = document.getElementById('chat-input');
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.classList.toggle('is-working', isBusy);
      sendButton.setAttribute('aria-label', isBusy ? 'Response in progress. Send another message.' : 'Send message');
    }
    if (input) {
      input.disabled = false;
      if (!isBusy) input.placeholder = 'اكتب هنا... (Enter للإرسال، Shift+Enter لسطر جديد)';
    }
  },
  finishResponse() {
    this.setResponseState(false);
    const next = this.pendingRequests.shift();
    if (!next) return;
    const input = document.getElementById('chat-input');
    const webToggle = document.getElementById('web-search-toggle');
    this.uploadedFiles = next.files;
    this.pendingVoiceBlob = next.voiceBlob;
    this.setMode(next.mode);
    if (webToggle) webToggle.checked = next.webSearch;
    document.getElementById('web-search-btn')?.classList.toggle('active', next.webSearch);
    if (input) {
      input.value = next.text;
      input.dispatchEvent(new Event('input'));
    }
    this.renderAttachments();
    window.setTimeout(() => this.sendMessage(), 0);
  },
  getDraftKey() {
    return this.currentChatId ? `ai_agent_draft_${this.currentChatId}` : null;
  },
  saveDraft(value) {
    const key = this.getDraftKey();
    if (!key || this.isIncognito) return;
    if (value.trim()) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  },
  restoreDraft() {
    const input = document.getElementById('chat-input');
    const key = this.getDraftKey();
    if (!input || !key || this.isIncognito) return;
    const draft = localStorage.getItem(key);
    if (!draft) return;
    input.value = draft;
    input.dispatchEvent(new Event('input'));
  },
  ALL_MODELS: {
    openai: {
      name: 'OpenAI', icon: 'sparkles', color: 'var(--text)', bg: 'rgba(255,255,255,0.1)', url: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-5.4', name: 'GPT-5.4', actualId: 'gpt-5.4', desc: 'تفكير متقدم، وكلاء وأعمال معقدة', reasoning: true },
        { id: 'gpt-5.3', name: 'GPT-5.3', actualId: 'gpt-5.3', desc: 'إجابات سريعة ودقيقة للمهام اليومية' },
        { id: 'gpt-5-mini', name: 'GPT-5 mini', actualId: 'gpt-5-mini', desc: 'خفيف وفعّال للمهام المتكررة' },
        { id: 'gpt-5-nano', name: 'GPT-5 nano', actualId: 'gpt-5-nano', desc: 'أسرع خيار للمهام القصيرة' }
      ]
    },
    gemini: {
      name: 'Google Gemini', icon: 'zap', color: 'var(--accent)', bg: 'rgba(59,130,246,0.1)', url: 'https://generativelanguage.googleapis.com',
      models: [
        { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', actualId: 'gemini-3.1-pro-preview', desc: 'تفكير معقد، برمجة ووكلاء', reasoning: true },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', actualId: 'gemini-3-flash-preview', desc: 'أداء قوي بزمن استجابة منخفض' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', actualId: 'gemini-2.5-pro', desc: 'تفكير عميق ومتعدد الوسائط', reasoning: true },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', actualId: 'gemini-2.5-flash', desc: 'توازن ممتاز بين السرعة والجودة' }
      ]
    },
    anthropic: {
      name: 'Anthropic Claude', icon: 'book', color: 'var(--yellow)', bg: 'rgba(245,158,11,0.1)', url: 'https://api.anthropic.com/v1/messages',
      models: [
        { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', actualId: 'claude-opus-4-6', desc: 'أعلى قدرة للتحليل والتخطيط', reasoning: true },
        { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', actualId: 'claude-sonnet-4-6', desc: 'برمجة وتخطيط عملي متقدم', reasoning: true },
        { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', actualId: 'claude-haiku-4-5-20251001', desc: 'استجابات سريعة واقتصادية' }
      ]
    },
    groq: {
      name: 'Meta / Groq', icon: 'box', color: 'var(--red)', bg: 'rgba(239,68,68,0.1)', url: 'https://api.groq.com/openai/v1',
      models: [
        { id: 'openai-gpt-oss-120b', name: 'GPT-OSS 120B', actualId: 'openai/gpt-oss-120b', desc: 'استدلال وأدوات وتنفيذ كود', reasoning: true },
        { id: 'qwen3-32b', name: 'Qwen3 32B', actualId: 'qwen/qwen3-32b', desc: 'تفكير سريع ومناسب للمهام المركبة', reasoning: true },
        { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', actualId: 'llama-3.3-70b-versatile', desc: 'نموذج عام قوي ومتوازن' },
        { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', actualId: 'llama-3.1-8b-instant', desc: 'أسرع استجابة ممكنة' }
      ]
    },
    deepseek: {
      name: 'DeepSeek (الصين)', icon: 'cpu', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', url: 'https://api.deepseek.com',
      models: [
        { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', actualId: 'deepseek-v4-pro', desc: 'الاستدلال المتقدم والبرمجة', reasoning: true },
        { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', actualId: 'deepseek-v4-flash', desc: 'سرعة عالية مع نمط تفكير قابل للضبط', reasoning: true }
      ]
    },
    xai: {
      name: 'X.AI Grok (أمريكا)', icon: 'zap', color: '#FFFFFF', bg: 'rgba(255,255,255,0.05)', url: 'https://api.x.ai/v1',
      models: [
        { id: 'grok-4-5', name: 'Grok 4.5', actualId: 'grok-4-5', desc: 'مساعد حديث متعدد المهام' },
        { id: 'grok-420-reasoning', name: 'Grok 4.20 Reasoning', actualId: 'grok-420-reasoning', desc: 'استدلال طويل للمهام المعقدة', reasoning: true }
      ]
    },
    perplexity: {
      name: 'Perplexity (أمريكا)', icon: 'search', color: '#2DD4BF', bg: 'rgba(45,212,191,0.1)', url: 'https://api.perplexity.ai',
      models: [
        { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', actualId: 'sonar-reasoning-pro', desc: 'تحليل متعدد الخطوات مع مصادر', reasoning: true },
        { id: 'sonar-pro', name: 'Sonar Pro', actualId: 'sonar-pro', desc: 'بحث متقدم في الويب', reasoning: false },
        { id: 'sonar', name: 'Sonar', actualId: 'sonar', desc: 'إجابات سريعة موثقة' }
      ]
    },
    local: {
      name: 'محلي (Ollama / LM Studio)',
      icon: 'hard-drive',
      color: 'var(--cyan)',
      bg: 'rgba(6,182,212,0.12)',
      url: 'http://localhost:11434',
      models: [
        { id: 'local-qwen3', name: 'Qwen3', actualId: 'qwen3', desc: 'ollama pull qwen3', reasoning: true },
        { id: 'local-deepseek-r1', name: 'DeepSeek R1', actualId: 'deepseek-r1', desc: 'ollama pull deepseek-r1', reasoning: true },
        { id: 'local-llama32', name: 'Llama 3.2', actualId: 'llama3.2', desc: 'ollama pull llama3.2' },
        { id: 'local-custom', name: 'نموذج مخصص', actualId: '__custom__', desc: 'اكتب الاسم في الإعدادات', isFree: true }
      ]
    },
    pollinations: {
      name: 'نماذج مجانية (Web Links)',
      icon: 'globe',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      url: 'https://text.pollinations.ai/openai',
      models: [
        { id: 'free-gpt4o', name: 'AI Agent Pro (مجاني)', actualId: 'openai', desc: 'أذكى نموذج متاح بدون إعدادات', isFree: true },
        { id: 'free-llama', name: 'Llama 3 (مجاني)', actualId: 'llama', desc: 'بحث وإنشاء نصوص', isFree: true },
        { id: 'free-mistral', name: 'Mistral (مجاني)', actualId: 'mistral', desc: 'سريع واقتصادي', isFree: true }
      ]
    }
  },
  init() {
    if (typeof firebaseAuth !== 'undefined') {
      firebaseAuth.onAuthStateChanged(user => {
        if (!user && localStorage.getItem('ai_logged_in') !== 'true') {
          window.location.href = 'login.html';
          return;
        }
        if (user) {
          localStorage.setItem('ai_logged_in', 'true');
          if (!localStorage.getItem('ai_user')) {
            localStorage.setItem('ai_user', JSON.stringify({
              type: user.isAnonymous ? 'guest' : 'firebase',
              name: user.displayName || user.email?.split('@')[0] || 'مستخدم',
              avatar: (user.displayName || user.email || 'U')[0].toUpperCase(),
              photo: user.photoURL || null,
              uid: user.uid
            }));
          }
          if (localStorage.getItem('terms_accepted') !== 'true') {
            window.location.href = 'terms.html?accept=1';
            return;
          }
        }
      });
    } else if (localStorage.getItem('ai_logged_in') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
    this.loadData();
    this.isLoading = false;
    this.isIncognito = false;
    document.body.classList.remove('incognito-mode');
    this.setupIdleLock();
    this.newChat();
    this.setupInput();
    this.setupScrollWatcher();
    this.setupReadingProgress();
    this.setupNetworkMonitor();
    this.recoverInput();
    this.syncUserAvatar();
    this.receiveSharedChat();
    if (window.MemoryPlugin) window.MemoryPlugin.init().catch(console.error);
    this.checkVideoDownloaderStatus();










    const msgRoot = document.getElementById('messages');
    if (msgRoot) {
      msgRoot.addEventListener('click', (e) => {
        const btn = e.target.closest('.code-container-premium .code-action-btn');
        if (btn) {
          e.preventDefault();
          Main.copyCode(btn);
        }
      });
    }
    if (typeof marked !== 'undefined') marked.setOptions({ breaks: true });
    if (this.isGuest()) {
      document.querySelectorAll('.icon-btn[onclick*="file"], .icon-btn[onclick*="attach"], #attach-btn, #file-input').forEach(el => el.style.display = 'none');
      document.querySelectorAll('[onclick*="Editor"], [onclick*="editor"], #nav-coding').forEach(el => el.style.display = 'none');
    }
    this.renderDynamicPrompts();
  },
  renderDynamicPrompts() {
    const container = document.querySelector('.quick-prompts');
    if (!container) return;
    const prompts = [
      { text: "اكتب كود Python لترتيب قائمة بخوارزمية Quick Sort مع شرح كل خطوة", title: "مساعد برمجي", icon: "code", cat: "برمجة" },
      { text: "اشرح لي مفهوم الشبكات العصبية التوليدية بطريقة بسيطة مع أمثلة", title: "شرح مفاهيم", icon: "cpu", cat: "تعليم" },
      { text: "ترجم النص التالي إلى الإنجليزية مع الحفاظ على المصطلحات التقنية", title: "ترجمة ذكية", icon: "languages", cat: "تحليل" },
      { text: "أعطني 5 أفكار مبتكرة لتطبيق موبايل في مجال الصحة والرياضة", title: "أفكار إبداعية", icon: "lightbulb", cat: "إبداعي" },
      { text: "قم بتحليل هذا الرابط واستخراج أهم النقاط منه: [رابط الموقع]", title: "تحليل الروابط", icon: "link", cat: "تحليل" },
      { text: "اكتب خطة تسويقية متكاملة لإطلاق منتج جديد في الأسواق", title: "خطة تسويق", icon: "trending-up", cat: "تسويق" },
      { text: "قم بمراجعة هذا الكود واكتشاف الأخطاء الأمنية أو البرمجية فيه", title: "مراجعة الكود", icon: "shield-check", cat: "برمجة" },
      { text: "لخص لي كتاب 'العادات الذرية' في 5 نقاط رئيسية قابلة للتطبيق", title: "تلخيص كتب", icon: "book-open", cat: "تعليم" }
    ];

    const catColors = {
      'برمجة': { glow: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
      'إبداعي': { glow: '#F472B6', bg: 'rgba(244,114,182,0.1)' },
      'تعليم': { glow: '#34D399', bg: 'rgba(52,211,153,0.1)' },
      'تسويق': { glow: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
      'تحليل': { glow: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
      'شخصي': { glow: '#F87171', bg: 'rgba(248,113,113,0.1)' },
    };

    const day = Math.floor(Date.now() / 86400000);
    const startIdx = (day % 2) * 4;
    const currentPrompts = prompts.slice(startIdx, startIdx + 4);

    container.innerHTML = currentPrompts.map(p => {
      const colors = catColors[p.cat] || catColors['تعليم'];
      const safeText = p.text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <div class="prompt-card-premium" onclick="Main.quickPrompt('${safeText}')"
             style="background: ${colors.bg}; border-color: ${colors.glow}; cursor: pointer; position: relative; overflow: hidden; border-radius: 16px; padding: 16px; border: 1px solid; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;">
          <div class="prompt-card-glow" style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; border-radius: 50%; filter: blur(30px); background: radial-gradient(circle at top right, ${colors.glow}20, transparent 70%);"></div>
          <div class="prompt-card-icon" style="width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${colors.glow}; background: ${colors.glow}15;">
            <i data-lucide="${p.icon}" style="width:20px;height:20px;"></i>
          </div>
          <div class="prompt-card-content" style="flex: 1; z-index: 1;">
            <div class="prompt-card-title" style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px;">${p.title}</div>
            <div class="prompt-card-desc" style="font-size: 11px; color: var(--text3); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.text}</div>
          </div>
          <div class="prompt-card-tag" style="position: absolute; top: 12px; left: 12px; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; color: ${colors.glow}; background: ${colors.glow}20;">
            ${p.cat}
          </div>
        </div>
      `;
    }).join('');
    if (window.lucide) lucide.createIcons();
  },
  quickPrompt(text) {
    if (this.isIncognito) {
      this.toggleIncognito();
    }
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },
  isGuest() {
    try {
      const u = JSON.parse(localStorage.getItem('ai_user') || '{}');
      return u.type === 'guest';
    } catch(e) { return false; }
  },
  toggleWebSearch(btn) {
    const toggle = document.getElementById('web-search-toggle');
    if (!toggle) return;
    toggle.checked = !toggle.checked;
    if (btn) btn.classList.toggle('active', toggle.checked);
    UI.toast(toggle.checked ? 'تم تفعيل بحث الويب' : 'تم إيقاف بحث الويب', 'info');
    this.updateActiveModesUI();
  },
  setupIdleLock() {
    let timer;
    let idleClassTimer;
    const reset = () => {
      clearTimeout(timer);
      clearTimeout(idleClassTimer);
      document.body.classList.remove('idle');
      idleClassTimer = setTimeout(() => document.body.classList.add('idle'), 2000);

      const m = parseInt(localStorage.getItem('idle_lock_minutes') || '0', 10);
      if (!m || m <= 0) return;
      timer = setTimeout(() => {
        localStorage.removeItem('ai_logged_in');
        window.location.href = 'login.html';
      }, m * 60000);
    };
    ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach(ev =>
      document.addEventListener(ev, reset, { passive: true }));
    reset();
  },
  syncUserAvatar() {
    try {
      const raw = localStorage.getItem('ai_user');
      if (!raw) return;
      const u = JSON.parse(raw);
      const isGuest = u.type === 'guest';

      const avs = document.querySelectorAll('.nav-avatar');
      if (!isGuest && u.avatar) avs.forEach(av => av.textContent = u.avatar);

      const display = document.getElementById('account-avatar-display');
      if (display && u.avatar && !isGuest) display.textContent = u.avatar;

      const nameEl = document.getElementById('account-name-edit');
      if (nameEl && !isGuest) nameEl.textContent = u.name || 'المستخدم';

      const sidebarNameEl = document.getElementById('sidebar-user-name');
      if (sidebarNameEl) sidebarNameEl.textContent = isGuest ? 'زائر' : (u.name || 'المستخدم');

      const email = isGuest ? 'guest@aiagent.pro' : (u.email || u.uid || 'user@example.com');
      const emailTop = document.getElementById('account-email-top');
      const emailBot = document.getElementById('account-email-bot');
      if (emailTop) emailTop.textContent = email;
      if (emailBot) emailBot.textContent = email;


      const sidebarFooterBtn = document.getElementById('sidebar-profile-btn');
      if (sidebarFooterBtn) {
        if (isGuest) {
          sidebarFooterBtn.innerHTML = `
            <div style="width:32px; height:32px; border-radius:50%; background:#444; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0;">
              <i data-lucide="log-in" style="width:16px;height:16px;"></i>
            </div>
            <span style="font-size:15px; font-weight:600; color:#fff; flex:1;">التسجيل / الدخول</span>
          `;
          sidebarFooterBtn.onclick = () => { UI.toggleSidebar(); window.location.href = 'login.html'; };
          lucide.createIcons();
        } else {
          sidebarFooterBtn.innerHTML = `
            <div class="nav-avatar" style="width:32px; height:32px; border-radius:50%; background:#444; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:600; color:#fff; margin:0; flex-shrink:0;">${u.avatar || 'A'}</div>
            <span style="font-size:15px; font-weight:500; color:#fff; flex:1;" id="sidebar-account-name">${u.name || 'المستخدم'}</span>
          `;
          sidebarFooterBtn.onclick = () => { UI.showModal('account-modal'); UI.toggleSidebar(); };
        }
      }
    } catch (e) {}
  },
  loadData() {
    try {
      if (!localStorage.getItem('v2026_upgraded')) {
        localStorage.removeItem('ai_chats_pro');
        localStorage.setItem('v2026_upgraded', 'true');
        this.chats = [];
      } else {
        const saved = localStorage.getItem('ai_chats_pro');
        if (saved) {
          try { this.chats = JSON.parse(saved) || []; } catch(e) { this.chats = []; }
        }
        let emptyCount = 0;
        this.chats = this.chats.filter(c => {
          if (!c || !c.messages) return false;
          if (c.messages.length === 0) {
            emptyCount++;
            return emptyCount === 1;
          }
          return true;
        });
        if (this.chats.length > 0) {
          this.currentChatId = this.chats[0].id;
        }
      }
      this.stats = JSON.parse(localStorage.getItem('ai_stats_pro') || '{"msgs":0,"chats":0,"tokens":0}');
      this.updateStatsUI();
      const elKey = localStorage.getItem('elevenlabs_api_key');
      if (elKey && document.getElementById('elevenlabs-key-input')) document.getElementById('elevenlabs-key-input').value = elKey;
      const customPrompt = localStorage.getItem('custom_prompt');
      if (customPrompt) document.getElementById('custom-system-prompt').value = customPrompt;
      const aiTone = localStorage.getItem('ai_tone');
      if (aiTone && document.getElementById('ai-tone')) document.getElementById('ai-tone').value = aiTone;
      const fontSize = localStorage.getItem('font_size');
      if (fontSize) {
        if (document.getElementById('font-size-select')) document.getElementById('font-size-select').value = fontSize;
        document.body.style.fontSize = fontSize;
      }
      const idleM = localStorage.getItem('idle_lock_minutes');
      const idleEl = document.getElementById('idle-lock-minutes');
      if (idleM && idleEl) idleEl.value = idleM;
      const persist = localStorage.getItem('persist');
      const pt = document.getElementById('persist-toggle');
      if (pt != null && persist != null) pt.checked = persist !== 'false';
      const ascroll = localStorage.getItem('autoscroll');
      const autoscEl = document.getElementById('autoscroll-toggle');
      if (autoscEl != null && ascroll != null) autoscEl.checked = ascroll !== 'false';
      const tempSaved = localStorage.getItem('temperature');
      const tempSlider = document.getElementById('temp-slider');
      const tempVal = document.getElementById('temp-val');
      if (tempSaved && tempSlider) {
        tempSlider.value = tempSaved;
        if (tempVal) tempVal.textContent = tempSaved;
      }
      const maxTokSaved = localStorage.getItem('max_tokens');
      const maxTokSel = document.getElementById('max-tokens');
      if (maxTokSaved && maxTokSel) maxTokSel.value = maxTokSaved;
      const localUrl = localStorage.getItem('local_ai_base_url');
      const localModel = localStorage.getItem('local_ai_model');
      const elLu = document.getElementById('local-ai-url');
      const elLm = document.getElementById('local-ai-model');
      if (elLu && localUrl) elLu.value = localUrl;
      if (elLm && localModel) elLm.value = localModel;
    } catch (e) { console.error('Error loading data', e); }
  },
  setupReadingProgress() {
    const msgRoot = document.getElementById('messages');
    const bar = document.getElementById('reading-progress-bar');
    if (!msgRoot || !bar) return;
    const update = () => {
      const max = msgRoot.scrollHeight - msgRoot.clientHeight;
      const p = max <= 0 ? 100 : Math.min(100, Math.round((msgRoot.scrollTop / max) * 100));
      bar.style.width = p + '%';
    };
    msgRoot.addEventListener('scroll', update, { passive: true });
    new MutationObserver(update).observe(msgRoot, { childList: true, subtree: true });
    update();
  },
  saveData() {
    if (localStorage.getItem('persist') !== 'false') {
      const toSave = this.chats.filter(c => c.id && !c.id.startsWith('incognito_'));
      toSave.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
      localStorage.setItem('ai_chats_pro', JSON.stringify(toSave.slice(0, 100)));
    }
    localStorage.setItem('ai_stats_pro', JSON.stringify(this.stats));
  },
  clearAllData() {
    if (confirm('تحذير: سيتم مسح جميع المحادثات والإعدادات. هل أنت متأكد؟')) {
      localStorage.clear();
      window.location.reload();
    }
  },
  clearStorage() {
    this.uploadedFiles = [];
    this.totalStorage = 0;
    this.updateStorageUI();
    const fl = document.getElementById('file-list');
    if (fl) fl.innerHTML = '';
    document.getElementById('attachments-preview').style.display = 'none';
    UI.toast('تم مسح الملفات المؤقتة لتوفير المساحة', 'success');
  },
  handleFileSelection(file) {
    if (file.type.startsWith('image/')) {
      const currentImages = this.uploadedFiles.filter(f => f.type.startsWith('image/')).length;
      if (currentImages >= 4) {
        UI.toast('عذراً، لا يمكن إرفاق أكثر من 4 صور في المرة الواحدة', 'error');
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        this.uploadedFiles.push({
          id: 'file_' + Date.now() + Math.random(),
          name: file.name || 'Pasted_Image.jpg',
          type: file.type,
          size: file.size,
          content: dataUrl
        });
        this.renderAttachments();
        this.totalStorage += file.size || 0;
        this.updateStorageUI();
      };
      img.src = URL.createObjectURL(file);
    } else {
      const reader = new FileReader();
      const textLike = (file.type && file.type.startsWith('text/')) ||
        /\.(txt|md|csv|json|html|htm|css|js|ts|py|xml|svg|yaml|yml)$/i.test(file.name || '');
      reader.onload = (e) => {
        this.uploadedFiles.push({
          id: 'file_' + Date.now() + Math.random(),
          name: file.name || 'file',
          type: file.type || (textLike ? 'text/plain' : 'application/octet-stream'),
          size: file.size,
          content: e.target.result
        });
        if (textLike && typeof MemoryPlugin !== 'undefined' && MemoryPlugin.processDocument) {
          MemoryPlugin.processDocument(file, e.target.result);
        }
        this.renderAttachments();
        this.totalStorage += file.size || 0;
        this.updateStorageUI();
      };
      if (textLike) reader.readAsText(file);
      else reader.readAsDataURL(file);
    }
  },
  removeFile(id) {
    const file = this.uploadedFiles.find(f => f.id === id);
    if (file) {
      this.totalStorage -= file.size;
      this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== id);
      this.renderAttachments();
      this.updateStorageUI();
    }
  },
  renderAttachments() {
    const previewEl = document.getElementById('attachments-preview');
    if (!previewEl) return;
    if (this.uploadedFiles.length === 0) {
      previewEl.style.display = 'none';
      previewEl.innerHTML = '';
      return;
    }
    previewEl.style.display = 'flex';
    previewEl.innerHTML = this.uploadedFiles.map(f => {
      let content = '';
      let extraStyle = '';
      if (f.isVoice) {
        const mins = Math.floor(f.voiceDuration/60).toString().padStart(2, '0');
        const secs = (f.voiceDuration%60).toString().padStart(2, '0');
        const bars = Array.from({ length: 30 }, () => `<div class="voice-wave-bar" style="height:${4 + Math.random() * 16}px; background:var(--accent)"></div>`).join('');
        content = `
          <div class="voice-message-premium" style="margin:0; background:transparent;">
            <button class="voice-play-pause" onclick="Main.playAudioMsg(this, '${f.content}')"><i data-lucide="play" style="width:16px;height:16px;margin-left:2px;"></i></button>
            <div class="voice-wave-visualizer" onclick="Main.seekAudio(event, this)">${bars}</div>
            <span class="voice-time" data-duration="${f.voiceDuration}">${mins}:${secs}</span>
          </div>`;
        extraStyle = 'background: transparent; border: none; padding: 0; min-width: 250px;';
      } else if (f.type.startsWith('image/')) {
        content = `<img src="${f.content}" alt="Attachment" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
        extraStyle = 'background: transparent; border: none; padding: 0;';
      } else {
        const ext = f.name.split('.').pop().toUpperCase();
        content = `
          <div class="file-icon" style="display:flex;align-items:center;gap:12px;width:100%;height:100%;padding:4px;">
            <i data-lucide="file" style="width:20px;height:20px;color:var(--text2);flex-shrink:0;"></i>
            <div style="flex:1;overflow:hidden;">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:var(--text);">${f.name}</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px;">${(f.size/1024).toFixed(1)} KB</div>
            </div>
          </div>`;
      }
      return `
        <div class="attachment-item" style="${extraStyle}">
          ${content}
          <button class="remove-attachment" style="background:rgba(0,0,0,0.5);color:#fff;" onclick="Main.removeFile('${f.id}')"><i data-lucide="x" style="width:14px;height:14px"></i></button>
        </div>
      `;
    }).join('');
    lucide.createIcons();
  },
  isIncognito: false,
  toggleIncognito() {
    if (this.messages && this.messages.length > 0) {
      UI.toast('لا يمكن تعديل الوضع الخفي أثناء المحادثة. قم ببدء محادثة جديدة.', 'warning');
      return;
    }
    this.isIncognito = !this.isIncognito;
    const navLogo = document.querySelector('.nav-logo');
    const ghostBtn = document.getElementById('nav-incognito');
    const welcomeIcon = document.querySelector('.welcome-icon');
    if (this.isIncognito) {
      this.currentChatId = 'incognito_' + Date.now();
      this.messages = [];
      document.body.classList.add('incognito-mode');
      if (navLogo) { navLogo.dataset.originalHtml = navLogo.innerHTML; navLogo.innerHTML = '<i data-lucide="eye-off" style="width:22px;height:22px;color:#fff"></i>'; }
      if (ghostBtn) ghostBtn.style.background = '#fff';
      if (ghostBtn) ghostBtn.style.color = '#000';
      if (welcomeIcon) {
        welcomeIcon.dataset.originalHtml = welcomeIcon.innerHTML;
        welcomeIcon.innerHTML = '<i data-lucide="eye-off" style="width:32px;height:32px;color:#fff"></i>';
      }
      lucide.createIcons();
      this.renderChatList();
      this.renderMessages();
      UI.toast('وضع المحادثة المخفية — لا يتم حفظ أي شيء', 'info');
    } else {
      document.body.classList.remove('incognito-mode');
      if (navLogo && navLogo.dataset.originalHtml) navLogo.innerHTML = navLogo.dataset.originalHtml;
      if (ghostBtn) { ghostBtn.style.background = ''; ghostBtn.style.color = ''; }
      if (welcomeIcon && welcomeIcon.dataset.originalHtml) {
        welcomeIcon.innerHTML = welcomeIcon.dataset.originalHtml;
      }
      lucide.createIcons();
      this.newChat();
      UI.toast('تم الخروج من الوضع المخفي', 'info');
    }
    this.updateNavUI();
  },
  updateNavUI() {
    const incognitoBtn = document.getElementById('nav-incognito');
    if (!incognitoBtn) return;
    if (this.messages && this.messages.length > 0) {
      if (!this.isIncognito) {
        incognitoBtn.style.display = 'none';
      } else {
        incognitoBtn.style.display = 'flex';
      }
    } else {
      incognitoBtn.style.display = 'flex';
    }
  },
  newChat() {
    if (this.isIncognito) {
      this.isIncognito = false;
      document.body.classList.remove('incognito-mode');
      const navLogo = document.querySelector('.nav-logo');
      const ghostBtn = document.getElementById('nav-incognito');
      const welcomeIcon = document.getElementById('welcome-icon-center');
      if (navLogo && navLogo.dataset.originalHtml) navLogo.innerHTML = navLogo.dataset.originalHtml;
      if (ghostBtn) { ghostBtn.style.background = ''; ghostBtn.style.color = ''; }
      if (welcomeIcon && welcomeIcon.dataset.originalHtml) {
        welcomeIcon.innerHTML = welcomeIcon.dataset.originalHtml;
      }
      if (window.lucide) lucide.createIcons();
    }
    this.chats = this.chats.filter(c => c.messages && c.messages.length > 0);
    const id = 'chat_' + Date.now();
    const chat = { id, title: 'محادثة جديدة', messages: [], timestamp: Date.now(), starred: false };
    this.chats.unshift(chat);
    this.currentChatId = id;
    this.messages = chat.messages;
    this.stats.chats++;
    this.saveData();
    this.renderChatList();
    this.renderMessages();
    this.updateStatsUI();
    const ht = document.getElementById('header-title');
    if (ht) ht.textContent = 'مساعد الذكاء الاصطناعي';
    document.getElementById('welcome-screen').style.display = 'flex';
    const input = document.getElementById('chat-input');
    if (input) { input.value = ''; input.style.height = 'auto'; }
    this.updateNavUI();
    UI.toast('محادثة جديدة', 'success');
  },
  renameChat(id) {
    this.closeChatMenus();
    const chat = this.chats.find(c => c.id === id);
    if (!chat) return;
    const newTitle = prompt('أدخل اسم المحادثة الجديد:', chat.title);
    if (newTitle && newTitle.trim()) {
      chat.title = newTitle.trim();
      this.saveData();
      this.renderChatList();
      UI.toast('تم إعادة تسمية المحادثة', 'success');
    }
  },
  autoTitleChat() {
    const chat = this.chats.find(c => c.id === this.currentChatId);
    if (!chat || chat.messages.length !== 1) return;
    const firstMsg = chat.messages[0].content || '';
    chat.title = firstMsg.substring(0, 40).trim() || 'محادثة جديدة';
    if (firstMsg.length > 40) chat.title += '...';
    this.saveData();
    this.renderChatList();
  },
  loadChat(id) {
    const chat = this.chats.find(c => c.id === id);
    if (!chat) return;
    this.currentChatId = id;
    this.messages = chat.messages || [];
    const ht2 = document.getElementById('header-title');
    if (ht2) ht2.textContent = chat.title;
    const starBtn = document.getElementById('star-btn');
    if (starBtn) {
      if (chat.starred) starBtn.classList.add('starred');
      else starBtn.classList.remove('starred');
    }
    this.renderChatList();
    this.renderMessages();
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
      welcome.style.display = this.messages.length > 0 ? 'none' : 'flex';
    }
    this.updateNavUI();
    this.restoreDraft();
    if (window.innerWidth <= 1023) UI.toggleSidebar();
  },
  pinChat(id) {
    this.closeChatMenus();
    const chat = this.chats.find(c => c.id === id);
    if (!chat) return;
    const pinnedCount = this.chats.filter(c => c.pinned).length;
    if (!chat.pinned && pinnedCount >= 3) {
      UI.toast('يمكنك تثبيت 3 محادثات فقط كحد أقصى', 'warning');
      return;
    }
    chat.pinned = !chat.pinned;
    this.saveData();
    this.renderChatList();
    UI.toast(chat.pinned ? 'تم التثبيت في الأعلى' : 'تم إلغاء التثبيت', 'success');
  },
  toggleChatMenu(e, id) {
    e.stopPropagation();
    const dropdown = document.getElementById('chat-dropdown-' + id);
    if (!dropdown) return;
    if (dropdown.parentElement === document.body) {
      this.closeChatMenus();
      return;
    }
    this.closeChatMenus();
    const button = document.getElementById('menu-btn-' + id);
    if (!button) return;
    const rect = button.getBoundingClientRect();
    document.body.appendChild(dropdown);
    dropdown.classList.add('show');
    dropdown.style.position = 'fixed';
    dropdown.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 232))}px`;
    dropdown.style.top = `${rect.bottom + 8 + 206 > window.innerHeight ? Math.max(8, rect.top - 206) : rect.bottom + 8}px`;
    dropdown.style.bottom = 'auto';
    dropdown.setAttribute('aria-hidden', 'false');
    this._chatMenuCloseHandler = (event) => {
      if (!dropdown.contains(event.target) && event.target !== button) this.closeChatMenus();
    };
    setTimeout(() => document.addEventListener('pointerdown', this._chatMenuCloseHandler, true), 0);
  },
  closeChatMenus() {
    document.querySelectorAll('.chat-dropdown.show, .chat-dropdown[data-menu-portal="true"]').forEach(menu => menu.remove());
    if (this._chatMenuCloseHandler) {
      document.removeEventListener('pointerdown', this._chatMenuCloseHandler, true);
      this._chatMenuCloseHandler = null;
    }
  },
  clearChat() {
    if (this.messages.length && !confirm('هل تريد مسح الرسائل؟')) return;
    this.messages = [];
    const chat = this.chats.find(c => c.id === this.currentChatId);
    if (chat) { chat.messages = []; this.saveData(); }
    this.renderMessages();
    this.updateNavUI();
    UI.toast('تم تفريغ المحادثة', 'info');
  },
  selectedChats: [],
  renderChatList() {
    const list = document.getElementById('chat-list');
    if (!list) return;
    this.closeChatMenus();

    if (!this._initialLoadSimulated && this.chats.length > 0) {
      this._initialLoadSimulated = true;
      list.innerHTML = `
        <div id="chat-list-skeleton">
          <div class="skeleton-item" style="height:40px; margin-bottom:8px; border-radius:12px; background:rgba(255,255,255,0.05); animation:pulse 1.5s infinite;"></div>
          <div class="skeleton-item" style="height:40px; margin-bottom:8px; border-radius:12px; background:rgba(255,255,255,0.05); animation:pulse 1.5s infinite; animation-delay:0.2s;"></div>
          <div class="skeleton-item" style="height:40px; margin-bottom:8px; border-radius:12px; background:rgba(255,255,255,0.05); animation:pulse 1.5s infinite; animation-delay:0.4s;"></div>
        </div>`;
      setTimeout(() => this.renderChatList(), 600);
      return;
    }

    if (!this.chats.length) {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">لا توجد محادثات سابقة</div>';
      return;
    }

    const pinned = this.chats.filter(c => c.pinned).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const recent = this.chats.filter(c => !c.pinned).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    let html = '';
    if (pinned.length > 0) {
      html += '<div class="chat-section-header">المثبتة</div>';
      pinned.forEach(c => html += this.renderChatItemHtml(c));
    }
    if (recent.length > 0) {
      html += '<div class="chat-section-header">الأخيرة</div>';
      recent.forEach(c => html += this.renderChatItemHtml(c));
    }
    list.innerHTML = html;
    lucide.createIcons();
  },
  renderChatItemHtml(c) {
    const isActive = c.id === this.currentChatId ? 'active' : '';
    const isMulti = document.body.classList.contains('multi-select-mode');
    const isSelected = this.selectedChats.includes(c.id) ? 'selected-for-delete' : '';
    const preview = c.messages && c.messages.length ? c.messages[c.messages.length - 1].content.substring(0, 40) + '...' : 'ابدأ محادثة جديدة...';
    const timeAgo = c.timestamp ? this.relativeTime(c.timestamp) : '';

    return `
      <div class="chat-item ${isActive} ${isSelected}" onclick="${isMulti ? `Main.toggleChatSelection('${c.id}')` : `Main.loadChat('${c.id}')`}"
           oncontextmenu="event.preventDefault(); Main.toggleMultiSelect('${c.id}')">
        <div class="chat-item-content" style="flex:1; min-width:0; display:flex; flex-direction:column; align-items:flex-start;">
          <div class="chat-item-title">${this.escHtml(c.title)}</div>
          <div class="chat-item-preview">${this.escHtml(preview)}</div>
        </div>

        ${!isMulti ? `
        <div class="chat-item-actions">
          <button type="button" class="icon-btn" style="width:24px;height:24px;background:transparent;" onclick="Main.toggleChatMenu(event, '${c.id}')" id="menu-btn-${c.id}" aria-label="إجراءات المحادثة" aria-haspopup="menu">
            <i data-lucide="more-horizontal" style="width:14px;height:14px"></i>
          </button>

          <div class="chat-dropdown" id="chat-dropdown-${c.id}" role="menu">
            <button type="button" class="dropdown-item" role="menuitem" onclick="event.stopPropagation(); Main.pinChat('${c.id}')">
              <i data-lucide="${c.pinned ? 'pin-off' : 'pin'}" style="width:14px;height:14px"></i>
              ${c.pinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
            </button>
            <button type="button" class="dropdown-item" role="menuitem" onclick="event.stopPropagation(); Main.renameChat('${c.id}')">
              <i data-lucide="edit-3" style="width:14px;height:14px"></i>
              إعادة تسمية
            </button>
            <button type="button" class="dropdown-item danger" role="menuitem" onclick="event.stopPropagation(); Main.deleteChat('${c.id}')">
              <i data-lucide="trash-2" style="width:14px;height:14px"></i>
              حذف المحادثة
            </button>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  },
  toggleMultiSelect(id = null) {
    if (document.body.classList.contains('multi-select-mode')) {
      this.exitMultiSelect();
    } else {
      document.body.classList.add('multi-select-mode');
      const normal = document.getElementById('sidebar-actions-normal');
      const bulk = document.getElementById('sidebar-actions-bulk');
      if (normal) normal.style.display = 'none';
      if (bulk) bulk.style.display = 'flex';
      this.selectedChats = id ? [id] : [];
      this.updateSelectedCount();
      this.renderChatList();
      UI.toast('وضع التحديد المتعدد مفعل', 'info');
    }
  },
  updateSelectedCount() {
    const el = document.getElementById('selected-count-sticky');
    if (el) el.textContent = this.selectedChats.length;
  },
  toggleChatSelection(chatId) {
    const idx = this.selectedChats.indexOf(chatId);
    if (idx >= 0) this.selectedChats.splice(idx, 1);
    else this.selectedChats.push(chatId);
    this.updateSelectedCount();
    this.renderChatList();
  },
  exitMultiSelect() {
    document.body.classList.remove('multi-select-mode');
    const normal = document.getElementById('sidebar-actions-normal');
    const bulk = document.getElementById('sidebar-actions-bulk');
    if (normal) normal.style.display = 'flex';
    if (bulk) bulk.style.display = 'none';
    this.selectedChats = [];
    this.renderChatList();
  },
  deleteSelectedChats() {
    if (!this.selectedChats.length) return;
    const count = this.selectedChats.length;
    this.chats = this.chats.filter(c => !this.selectedChats.includes(c.id));
    if (this.selectedChats.includes(this.currentChatId)) {
      this.currentChatId = null;
      this.messages = [];
    }
    this.saveData();
    this.exitMultiSelect();
    if (!this.currentChatId) this.newChat();
    UI.toast(`تم حذف ${count} محادثة`, 'success');
  },
  deleteChat(id) {
    this.closeChatMenus();
    this.chats = this.chats.filter(c => c.id !== id);
    this.saveData();
    if (this.currentChatId === id) this.newChat();
    else this.renderChatList();
    UI.toast('تم حذف المحادثة', 'info');
  },
  searchHistory(query) {
    if (!query) { this.renderChatList(); return; }
    const q = query.toLowerCase();
    const filtered = this.chats.filter(c => c.title.toLowerCase().includes(q));
    const list = document.getElementById('chat-list');
    list.innerHTML = filtered.map(c => `
      <div class="chat-item ${c.id === this.currentChatId ? 'active' : ''}" onclick="Main.loadChat('${c.id}')">
        <div class="chat-item-title">${this.escHtml(c.title)}</div>
      </div>
    `).join('');
  },
  setupInput() {
    const input = document.getElementById('chat-input');
    const updatePlaceholder = () => {
      if (window.innerWidth <= 768) {
        input.placeholder = 'رسالة...';
      } else {
        input.placeholder = 'اكتب هنا... (Enter للإرسال، Shift+Enter لسطر جديد)';
      }
    };
    window.addEventListener('resize', updatePlaceholder);
    updatePlaceholder();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    input.addEventListener('paste', (e) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          Main.handleFileSelection(blob);
          e.preventDefault();
        }
      }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) {
          UI.toggleSidebar();
        }
        document.getElementById('history-search')?.focus();
        UI.toast('تم فتح قائمة الأوامر (Command Palette)', 'info');
      }
    });
    input.addEventListener('input', () => {
      const len = input.value.length;
      this.saveDraft(input.value);
      const oldHeight = input.offsetHeight;
      input.style.height = 'auto';
      const newHeight = Math.min(input.scrollHeight, 200);
      input.style.height = newHeight + 'px';
      const diff = newHeight - oldHeight;
      if (diff > 0) {
        const msgContainer = document.getElementById('messages');
        msgContainer.scrollTop += diff;
      }
      const charCountEl = document.getElementById('char-count');
      if (charCountEl) {
        charCountEl.textContent = `${len} / 8000`;
        charCountEl.style.color = len > 7500 ? 'var(--red)' : 'var(--text3)';
      }

      document.body.classList.add('user-typing');

      const incognitoBtn = document.getElementById('nav-incognito');
      const mobileIncogBtn = document.getElementById('mobile-incognito-btn');
      if (input.value.trim() && !this.isIncognito) {
        if (incognitoBtn) incognitoBtn.style.display = 'none';
        if (mobileIncogBtn) mobileIncogBtn.style.display = 'none';
      } else if (!input.value.trim() && (!this.messages || this.messages.length === 0)) {
        if (incognitoBtn) incognitoBtn.style.display = 'flex';
        if (mobileIncogBtn) mobileIncogBtn.style.display = 'flex';
      }

      clearTimeout(this._typingTimer);
      this._typingTimer = setTimeout(() => {
        if (!document.getElementById('chat-input').value.trim()) {
          document.body.classList.remove('user-typing');
        }
      }, 3000);
    });
  },
  getApiConfig() {
    let family = 'groq';
    let actualModelId = this.currentModel;
    let apiUrl = 'https://api.openai.com/v1';
    if (this.currentModel === 'default-pro') {
      actualModelId = 'llama-3.3-70b-versatile';
      family = 'groq';
      apiUrl = 'https://api.groq.com/openai/v1';
    } else {
      for (const [provider, data] of Object.entries(this.ALL_MODELS)) {
        const found = data.models.find(m => m.id === this.currentModel);
        if (found) {
          family = provider;
          if (found.actualId === '__custom__') {
            actualModelId = (document.getElementById('local-ai-model')?.value || localStorage.getItem('local_ai_model') || 'llama3.2').trim();
          } else {
            actualModelId = found.actualId;
          }
          apiUrl = data.url;
          if (family === 'anthropic') {
            if (!apiUrl.endsWith('/messages')) {
              apiUrl = apiUrl.replace(/\/$/, '') + '/messages';
            }
          } else if (family !== 'gemini' && family !== 'local' && family !== 'pollinations' && !apiUrl.endsWith('/chat/completions')) {
            apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
          }
          break;
        }
      }
    }
    if (family === 'local') {
      let base = (document.getElementById('local-ai-url')?.value || localStorage.getItem('local_ai_base_url') || apiUrl).trim();
      if (!/^https?:\/\//.test(base)) base = 'http://' + base;
      if (!base.endsWith('/v1/chat/completions') && !base.endsWith('/api/chat')) {
         base = base.replace(/\/$/, '') + '/v1/chat/completions';
      }
      return { apiUrl: base, apiKey: '', actualModelId, family: 'local' };
    }
    const keys = JSON.parse(localStorage.getItem(`api_keys_${family}`) || '[]');
    const apiKey = keys[0] || '';
    if (family === 'gemini') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${actualModelId}:generateContent`;
    }
    const customUrl = document.getElementById('custom-base-url')?.value || localStorage.getItem('custom_cloud_url');
    if (customUrl && customUrl.trim() !== '') apiUrl = customUrl.trim();
    return { apiUrl, apiKey, actualModelId, family };
  },
  buildAuthHeaders(family, apiKey) {
    const h = { 'Content-Type': 'application/json' };
    if (family === 'local') return h;
    if (family === 'gemini') {
      if (apiKey && String(apiKey).trim()) h['x-goog-api-key'] = String(apiKey).trim();
      return h;
    }
    if (family === 'anthropic') {
      h['x-api-key'] = apiKey || '';
      h['anthropic-version'] = '2023-06-01';
      h['anthropic-dangerous-direct-browser-access'] = 'true';
      return h;
    }
    if (apiKey && String(apiKey).trim()) h['Authorization'] = `Bearer ${apiKey}`;
    return h;
  },
  buildRequestBody(family, actualModelId, apiMessages, temp, maxTok, options = {}) {
    if (family === 'gemini') {
      const systemParts = apiMessages.filter(m => m.role === 'system').map(m => m.content).join('\n');
      const contents = [];
      apiMessages.filter(m => m.role !== 'system').forEach(m => {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      });
      const body = { contents };
      if (systemParts) body.systemInstruction = { parts: [{ text: systemParts }] };
      const temperature = actualModelId.startsWith('gemini-3') ? 1.0 : (temp || 0.7);
      body.generationConfig = { temperature, maxOutputTokens: maxTok || 4096 };
      if (options.deepThinking && actualModelId.startsWith('gemini-3')) {
        body.generationConfig.thinkingConfig = { thinkingLevel: 'high' };
      }
      return body;
    }
    if (family === 'anthropic') {
      const systemContent = apiMessages.filter(m => m.role === 'system').map(m => m.content).join('\n');
      const msgs = apiMessages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));
      return { model: actualModelId, system: systemContent, messages: msgs, max_tokens: maxTok || 4096, temperature: temp || 0.7 };
    }
    const body = { model: actualModelId, messages: apiMessages, temperature: temp || 0.7, max_tokens: maxTok || 4096 };
    const supportsReasoningEffort = family === 'deepseek' ||
      (family === 'groq' && /^(openai\/gpt-oss|qwen\/qwen3)/.test(actualModelId));
    if (options.deepThinking && supportsReasoningEffort) body.reasoning_effort = 'high';
    return body;
  },
  parseAIResponse(family, data) {
    if (family === 'gemini') {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts.map(p => p.text).join('');
      }
      throw new Error(data.error?.message || 'لا توجد استجابة من Gemini');
    }
    if (family === 'anthropic') {
      if (data.content && data.content[0]) {
        return data.content[0].text;
      }
      throw new Error(data.error?.message || 'لا توجد استجابة من Claude');
    }
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error(data.error?.message || 'استجابة غير متوقعة من الخادم');
  },
  extractSearchKeywords(text) {
    const t = (text || '').trim();
    if (!t) return 'technology';
    const stop = new Set(['ما', 'من', 'في', 'على', 'أن', 'إلى', 'هل', 'كيف', 'لماذا', 'the', 'a', 'an', 'is', 'what', 'how', 'why', 'and', 'or']);
    const words = t.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1 && !stop.has(w.toLowerCase()));
    return (words.slice(0, 6).join(' ') || t.slice(0, 48)).trim();
  },
  async fetchOpenLibrarySnippets(query) {
    try {
      const q = encodeURIComponent(String(query).slice(0, 100));
      const res = await fetch(`https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`);
      if (!res.ok) return [];
      const data = await res.json();
      const docs = data.docs || [];
      return docs.map(d => {
        const title = d.title || '';
        const authors = (d.author_name && d.author_name[0]) ? d.author_name[0] : '';
        const key = d.key || '';
        const url = key ? `https://openlibrary.org${key}` : '';
        return `مصدر (مكتبة مفتوحة): ${title}${authors ? ' — ' + authors : ''}
الرابط: ${url}`;
      });
    } catch (e) {
      return [];
    }
  },
  pendingVoiceBlob: null,
  pendingVoiceUrl: null,
  async shareChatFirebase() {
    if (!this.messages || this.messages.length === 0) {
      UI.toast('لا توجد رسائل لمشاركتها', 'error');
      return;
    }
    if (typeof firebaseDB === 'undefined') {
      UI.toast('Firebase غير متوفر', 'error');
      return;
    }
    UI.toast('جاري رفع المحادثة...', 'info');
    try {
      const shareId = 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
      const chat = this.chats.find(c => c.id === this.currentChatId);
      const shareData = {
        title: chat ? chat.title : 'محادثة مشتركة',
        messages: this.messages.map(m => ({
          role: m.role,
          content: m.content,
          display: m.display || null,
          time: m.time || null
        })),
        sharedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      await firebaseDB.ref('shared_chats/' + shareId).set(shareData);
      const shareUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'index.html?share=' + shareId;
      await navigator.clipboard.writeText(shareUrl);
      UI.toast('تم نسخ رابط المشاركة! أرسله لصديقك', 'success');
      UI.toggleShare();
    } catch (err) {
      console.error('Share error:', err);
      UI.toast('حدث خطأ أثناء المشاركة: ' + err.message, 'error');
    }
  },
  async receiveSharedChat() {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (!shareId || typeof firebaseDB === 'undefined') return;
    UI.toast('جاري استلام المحادثة المشتركة...', 'info');
    try {
      const snapshot = await firebaseDB.ref('shared_chats/' + shareId).once('value');
      const data = snapshot.val();
      if (!data) {
        UI.toast('المحادثة غير موجودة أو تم استلامها مسبقاً', 'error');
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
      const chatId = 'chat_' + Date.now();
      const newChat = {
        id: chatId,
        title: '📥 ' + (data.title || 'محادثة مشتركة'),
        messages: data.messages || [],
        timestamp: Date.now(),
        starred: false
      };
      this.chats.unshift(newChat);
      this.currentChatId = chatId;
      this.messages = newChat.messages;
      this.saveData();
      this.renderChatList();
      this.renderMessages();
      document.getElementById('welcome-screen').style.display = 'none';
      await firebaseDB.ref('shared_chats/' + shareId).remove();
      window.history.replaceState({}, '', window.location.pathname);
      UI.toast('تم استلام المحادثة بنجاح! يمكنك الآن المتابعة', 'success');
    } catch (err) {
      console.error('Receive share error:', err);
      UI.toast('خطأ في استلام المحادثة', 'error');
    }
  },
  isVideoDownloaderConnected: false,
  async checkVideoDownloaderStatus() {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:5000/status', { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          this.isVideoDownloaderConnected = true;
          const wrapper = document.getElementById('video-downloader-wrapper');
          if (wrapper) wrapper.style.display = 'none';
        } else {
          this.isVideoDownloaderConnected = false;
        }
      } catch (e) {
        this.isVideoDownloaderConnected = false;
        const wrapper = document.getElementById('video-downloader-wrapper');
        if (wrapper) wrapper.style.display = 'block';
      }
    };
    await check();
    setInterval(check, 10000);
  },
  async fetchVideoInfo(url) {
    try {
      const res = await fetch('http://localhost:5000/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  },
  buildVideoWidget(wId, wUrl, info) {
    const title = (info && info.title) ? info.title : '';
    const thumb = (info && info.thumbnail) ? info.thumbnail : '';
    const dur = (info && info.duration) ? ` • ${Math.floor(info.duration/60)}:${String(info.duration%60).padStart(2,'0')}` : '';
    const safeUrl = this.escHtml(wUrl);
    const encodedUrl = encodeURIComponent(wUrl);
    const embedHtml = thumb ? `<img class="vid-thumb" src="${thumb}" alt="" onerror="this.style.display='none'">` : `<div class="vid-thumb-placeholder">▶️</div>`;

    const qualities = ['1080p', '720p', '480p', '360p'];
    const qualityBtns = qualities.map((q, i) =>
      `<button type="button" class="vid-quality-btn${i===1?' active':''}" data-q="${q}" onclick="Main.selectVideoQuality('${wId}', this)">${q}</button>`
    ).join('');

    const actionRow = `
      <div class="vid-quality-row" id="quality-row-${wId}">${qualityBtns}</div>
      <div class="vid-action-row">
        <button type="button" class="vid-download-btn primary" onclick="Main.triggerVideoDownload(decodeURIComponent('${encodedUrl}'), 'video', '${wId}')"><i data-lucide="download"></i> تحميل فيديو</button>
        <button type="button" class="vid-download-btn secondary" onclick="Main.triggerVideoDownload(decodeURIComponent('${encodedUrl}'), 'audio', '${wId}')"><i data-lucide="headphones"></i> تحميل صوت</button>
      </div>`;

    return `
      <div class="video-download-widget" id="video-widget-${wId}">
        ${embedHtml}
        <div class="vid-meta">
          ${title ? `<div class="vid-title">${this.escHtml(title)}${dur}</div>` : ''}
          <a class="vid-url-link" href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a>
          ${actionRow}
        </div>
      </div>`;
  },
  buildDownloadProgress(msgId, type, progress = 0) {
    const noun = type === 'video' ? 'الفيديو' : 'الصوت';
    const icon = type === 'video' ? 'video' : 'headphones';
    return `
      <div class="download-job-card" id="dl-waves-${msgId}" aria-live="polite">
        <div class="download-job-icon"><i data-lucide="${icon}"></i></div>
        <div class="download-job-details">
          <div class="download-job-title">جارٍ تحميل ${noun}</div>
          <div class="download-job-subtitle">سيظهر المشغل هنا فور اكتمال الحفظ</div>
          <div class="download-wave-row" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div id="plabel-${msgId}" class="download-job-progress">${Math.round(progress)}%</div>
      </div>`;
  },
  buildDownloadError(message) {
    return `<div class="download-error"><i data-lucide="circle-alert"></i>${this.escHtml(message)}</div>`;
  },
  buildMediaPlayer(msgId, type, file, title = '') {
    const mediaId = `custom-media-${msgId}`;
    const playerId = `custom-player-${msgId}`;
    const mediaUrl = `http://localhost:5000/stream/${encodeURIComponent(file || '')}`;
    const isVideo = type === 'video';
    const label = isVideo ? 'مشغل الفيديو الذكي' : 'مشغل الصوت الذكي';
    const media = isVideo
      ? `<video id="${mediaId}" src="${mediaUrl}" playsinline preload="metadata" onloadedmetadata="Main.syncMediaPlayer('${msgId}')" ontimeupdate="Main.syncMediaPlayer('${msgId}')" onplay="Main.syncMediaPlayer('${msgId}')" onpause="Main.syncMediaPlayer('${msgId}')" onended="Main.syncMediaPlayer('${msgId}')"></video>`
      : `<audio id="${mediaId}" src="${mediaUrl}" preload="metadata" onloadedmetadata="Main.syncMediaPlayer('${msgId}')" ontimeupdate="Main.syncMediaPlayer('${msgId}')" onplay="Main.syncMediaPlayer('${msgId}')" onpause="Main.syncMediaPlayer('${msgId}')" onended="Main.syncMediaPlayer('${msgId}')"></audio>`;
    return `
      <section class="advanced-media-player ${isVideo ? 'is-video' : 'is-audio'}" id="${playerId}">
        <div class="avp-header">
          <span class="avp-brand"><i data-lucide="${isVideo ? 'video' : 'headphones'}"></i>${label}</span>
          <span class="avp-saved"><i data-lucide="check-circle-2"></i> محفوظ</span>
        </div>
        ${isVideo ? `<div class="avp-stage">${media}<div class="avp-video-shade"></div></div>` : `<div class="avp-audio-art"><i data-lucide="audio-lines"></i></div>${media}`}
        <div class="avp-controls">
          <button type="button" class="avp-control avp-play" id="avp-play-${msgId}" onclick="Main.toggleCustomPlayer('${msgId}')" aria-label="تشغيل"><i data-lucide="play"></i></button>
          <span class="avp-time" id="avp-current-${msgId}">0:00</span>
          <input type="range" class="avp-timeline" id="avp-range-${msgId}" min="0" max="100" value="0" step="0.1" oninput="Main.seekMediaPlayer('${msgId}', this.value)" aria-label="موضع التشغيل">
          <span class="avp-time" id="avp-total-${msgId}">0:00</span>
          <button type="button" class="avp-control" onclick="Main.toggleMediaMute('${msgId}')" aria-label="كتم الصوت"><i id="avp-volume-${msgId}" data-lucide="volume-2"></i></button>
          ${isVideo ? `<button type="button" class="avp-control" onclick="Main.toggleMediaFullscreen('${msgId}')" aria-label="ملء الشاشة"><i data-lucide="maximize"></i></button>` : ''}
        </div>
        ${title ? `<div class="avp-title">${this.escHtml(title)}</div>` : ''}
      </section>`;
  },
  getVideoWidgetMessage(msgId, chatId = this.currentChatId) {
    const chat = this.chats.find(item => item.id === chatId);
    const messages = chat?.messages || (chatId === this.currentChatId ? this.messages : []);
    return messages.find(message => message.videoWidgetId === msgId);
  },
  failVideoDownload(msgId, chatId, type, message) {
    const widgetMessage = this.getVideoWidgetMessage(msgId, chatId);
    if (widgetMessage) widgetMessage.videoDownload = { status: 'error', type, error: message };
    this.saveData();
    const widgetContent = document.getElementById('dl-waves-' + msgId)?.closest('.msg-content-wrapper');
    if (widgetContent) {
      widgetContent.innerHTML = this.buildDownloadError(message);
      try { lucide.createIcons(); } catch (e) {}
    }
  },
  selectVideoQuality(wId, btn) {
    const row = document.getElementById('quality-row-' + wId);
    if (!row) return;
    row.querySelectorAll('.vid-quality-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },
  getSelectedQuality(wId) {
    const row = document.getElementById('quality-row-' + wId);
    if (!row) return '720p';
    const active = row.querySelector('.vid-quality-btn.active');
    return active ? active.dataset.q : '720p';
  },
  async triggerVideoDownload(url, type, msgId) {
    if (!this.isVideoDownloaderConnected) {
      UI.toast('تأكد من تشغيل أداة التحميل على جهازك', 'error');
      return;
    }
    const quality = type === 'video' ? this.getSelectedQuality(msgId) : null;
    const chatId = this.currentChatId;
    this.videoDownloads[msgId] = { url, type, quality, chatId };
    const widgetMessage = this.getVideoWidgetMessage(msgId, chatId);
    if (widgetMessage) widgetMessage.videoDownload = { status: 'downloading', type, quality };
    this.saveData();

    const widgetContent = document.getElementById('video-widget-' + msgId)?.closest('.msg-content-wrapper');
    if (widgetContent) {
      widgetContent.innerHTML = this.buildDownloadProgress(msgId, type);
      try { lucide.createIcons(); } catch (e) {}
    }
    try {
      const res = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type, quality })
      });
      if (!res.ok) {
        const message = 'فشل بدء التحميل من الخادم المحلي.';
        this.failVideoDownload(msgId, chatId, type, message);
        UI.toast(message, 'error');
        return;
      }
      const data = await res.json();
      if (data.job_id) {
        this.pollVideoProgress(data.job_id, msgId, type);
      } else {
        this.failVideoDownload(msgId, chatId, type, `تعذر بدء التحميل: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (e) {
      this.failVideoDownload(msgId, chatId, type, 'تعذر الاتصال بخادم التنزيل المحلي.');
    }
  },
  pollVideoProgress(jobId, msgId, type) {
    const poll = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:5000/progress/' + jobId);
        if (!res.ok) {
          clearInterval(poll);
          const job = this.videoDownloads[msgId] || {};
          this.failVideoDownload(msgId, job.chatId || this.currentChatId, type, 'تعذر متابعة حالة التنزيل.');
          return;
        }
        const data = await res.json();
        if (data.status === 'downloading') {
          const pct = Math.round(data.progress || 0);
          const plabel2 = document.getElementById('plabel-' + msgId);
          if (plabel2) plabel2.innerHTML = `جاري التحميل... <span>${pct}%</span>`;
        } else if (data.status === 'completed') {
          clearInterval(poll);
          const job = this.videoDownloads[msgId] || {};
          const dl = JSON.parse(localStorage.getItem('vid_dl') || '{}');
          dl[job.url || ''] = data.file || true;
          localStorage.setItem('vid_dl', JSON.stringify(dl));
          const targetChat = this.chats.find(item => item.id === job.chatId);
          const targetMessages = targetChat?.messages || this.messages;
          const widgetMessage = targetMessages.find(message => message.videoWidgetId === msgId);
          if (widgetMessage) {
            widgetMessage.videoDownload = { status: 'completed', type, file: data.file || '', title: widgetMessage.videoTitle || '' };
          }
          const sysMsg = { role: 'system', content: `تم تنزيل ${type === 'video' ? 'الفيديو' : 'الصوت'} وحفظه بنجاح في مجلد التنزيلات.`, time: this.now() };
          targetMessages.push(sysMsg);
          if (job.chatId === this.currentChatId) {
            const widgetContent = document.getElementById('dl-waves-' + msgId)?.closest('.msg-content-wrapper');
            if (widgetContent) widgetContent.innerHTML = this.buildMediaPlayer(msgId, type, data.file || '', widgetMessage?.videoTitle || '');
            this.appendMessage(sysMsg, true);
            try { lucide.createIcons(); } catch (e) {}
          }
          this.saveData();
        } else if (data.status === 'error') {
          clearInterval(poll);
          const job = this.videoDownloads[msgId] || {};
          this.failVideoDownload(msgId, job.chatId || this.currentChatId, type, `تعذر التحميل: ${data.error || 'خطأ غير معروف'}`);
        }
      } catch (e) {
        clearInterval(poll);
        const job = this.videoDownloads[msgId] || {};
        this.failVideoDownload(msgId, job.chatId || this.currentChatId, type, 'انقطع الاتصال بخادم التنزيل المحلي.');
      }
    }, 1500);
  },
  toggleCustomPlayer(msgId) {
    const media = document.getElementById('custom-media-' + msgId);
    if (!media) return;
    if (media.paused) media.play().catch(() => {});
    else media.pause();
  },
  syncMediaPlayer(msgId) {
    const media = document.getElementById('custom-media-' + msgId);
    if (!media) return;
    const range = document.getElementById('avp-range-' + msgId);
    const current = document.getElementById('avp-current-' + msgId);
    const total = document.getElementById('avp-total-' + msgId);
    const playButton = document.getElementById('avp-play-' + msgId);
    if (range && Number.isFinite(media.duration)) {
      range.max = String(media.duration);
      range.value = String(media.currentTime);
    }
    if (current) current.textContent = this.formatMediaTime(media.currentTime);
    if (total) total.textContent = this.formatMediaTime(media.duration);
    if (playButton) {
      playButton.innerHTML = `<i data-lucide="${media.paused ? 'play' : 'pause'}"></i>`;
      try { lucide.createIcons(); } catch (e) {}
    }
  },
  seekMediaPlayer(msgId, value) {
    const media = document.getElementById('custom-media-' + msgId);
    if (!media || !Number.isFinite(media.duration)) return;
    media.currentTime = Math.min(media.duration, Math.max(0, Number(value)));
    this.syncMediaPlayer(msgId);
  },
  toggleMediaMute(msgId) {
    const media = document.getElementById('custom-media-' + msgId);
    const icon = document.getElementById('avp-volume-' + msgId);
    if (!media) return;
    media.muted = !media.muted;
    if (icon) {
      icon.setAttribute('data-lucide', media.muted ? 'volume-x' : 'volume-2');
      try { lucide.createIcons(); } catch (e) {}
    }
  },
  toggleMediaFullscreen(msgId) {
    const player = document.getElementById('custom-player-' + msgId);
    if (!player) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else player.requestFullscreen?.();
  },
  async handleVideoUrl(url, msgId) {
    if (!this.isVideoDownloaderConnected) return;
    const widget = document.getElementById('video-widget-' + msgId);
    if (!widget) return;
    const info = await this.fetchVideoInfo(url);
    if (widget && info) {
      const title = info.title || '';
      const thumb = info.thumbnail || '';
      const dur = info.duration ? ` • ${Math.floor(info.duration/60)}:${String(info.duration%60).padStart(2,'0')}` : '';
      if (title) {
        const titleEl = widget.querySelector('.vid-title');
        if (titleEl) titleEl.textContent = title + dur;
        const widgetMessage = this.getVideoWidgetMessage(msgId);
        if (widgetMessage) {
          widgetMessage.videoTitle = title;
          this.saveData();
        }
      }
      if (thumb) {
        const oldThumb = widget.querySelector('.vid-thumb-placeholder');
        if (oldThumb) {
          const img = document.createElement('img');
          img.className = 'vid-thumb';
          img.src = thumb;
          img.onerror = () => img.style.display = 'none';
          oldThumb.replaceWith(img);
        }
      }
    }
  },
  async sendMessage() {
    if (this.isLoading) {
      this.queueMessage();
      return;
    }
    const input = document.getElementById('chat-input');
    let text = input.value.trim();
    const userTypedText = text;
    if (!text && !this.uploadedFiles.length && !this.pendingVoiceBlob) return;
    let displayHtml = text ? this.linkify(this.escHtml(text)) : '';
    let attachmentsHtml = '';
    let payloadContent = null;
    let hasImages = false;
    if (this.uploadedFiles.length > 0) {
      const images = this.uploadedFiles.filter(f => f.type.startsWith('image/'));
      hasImages = images.length > 0;

      let imgGridHtml = '';
      if (images.length > 0) {
        imgGridHtml = `<div class="image-grid count-${Math.min(images.length, 4)}">`;
        images.slice(0, 4).forEach(f => {
          imgGridHtml += `<img src="${f.content}" alt="Attachment" onclick="Main.openLightbox('${f.content}')">`;
        });
        imgGridHtml += '</div>';
      }

      this.uploadedFiles.forEach(f => {
        if (f.isVoice) {
          const bars = Array.from({ length: 30 }, () => `<div class="voice-wave-bar" style="height:${4 + Math.random() * 16}px"></div>`).join('');
          attachmentsHtml += `<div class="voice-message-premium">
            <button class="voice-play-pause" onclick="Main.playAudioMsg(this, '${f.content}')"><i data-lucide="play" style="width:16px;height:16px;margin-left:2px;"></i></button>
            <div class="voice-wave-visualizer" onclick="Main.seekAudio(event, this)">${bars}</div>
            <span class="voice-time" data-duration="${f.voiceDuration}">${Math.floor(f.voiceDuration/60).toString().padStart(2,'0')}:${(f.voiceDuration%60).toString().padStart(2,'0')}</span>
          </div>`;
          if (f.voiceTranscript) text += '\n' + f.voiceTranscript;
        } else if (!f.type.startsWith('image/')) {
          attachmentsHtml += `<div class="attachment-chip"><i data-lucide="file" style="width:12px;height:12px"></i> ${this.escHtml(f.name)}</div>`;
        }
      });

      if (imgGridHtml) attachmentsHtml = imgGridHtml + attachmentsHtml;
    }
    if (this.pendingVoiceBlob) {
      this.pendingVoiceBlob = null;
    }
    if (attachmentsHtml) displayHtml = `<div class="msg-attachments-wrap">${attachmentsHtml}</div>` + displayHtml;
    input.value = '';
    input.style.height = 'auto';
    input.blur();
    this.saveDraft('');
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('attachments-preview').style.display = 'none';
    const hasVoice = this.uploadedFiles.some(f => f.isVoice);
    const hasImage = this.uploadedFiles.some(f => f.type.startsWith('image/'));
    const isVoiceOnlyMsg = hasVoice && !hasImage && !userTypedText;
    const isImageOnlyMsg = hasImage && !hasVoice && !userTypedText;
    const userMsg = { role: 'user', content: text, display: displayHtml, time: this.now(), isVoiceOnly: isVoiceOnlyMsg, isImageOnly: isImageOnlyMsg, hasMedia: hasVoice || hasImage, files: this.uploadedFiles.map(f => ({ ...f })) };
    this.messages.push(userMsg);
    this.appendMessage(userMsg, true);
    this.updateNavUI();
    if (!this.isIncognito) this.autoTitleChat();


    if (this.isVideoDownloaderConnected && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('tiktok.com'))) {
        const msgId = Date.now().toString();
        const aiMsg = {
            role: 'assistant',
            content: `لقد اكتشفت رابط فيديو.\n[UI_WIDGET:VIDEO_DOWNLOAD:${msgId}:${text}]`,
            time: this.now(),
            videoWidgetId: msgId,
            videoUrl: text
        };
        this.messages.push(aiMsg);
        this.appendMessage(aiMsg, true);
        this.saveData();
        return;
    }

    const drawKeywords = ['ارسم ', 'تخيل ', 'صمم ', 'draw ', 'imagine ', 'generate image '];

    if (drawKeywords.some(k => text.toLowerCase().startsWith(k)) || text.toLowerCase().trim() === 'ارسم') {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        if (userObj.type === 'guest') {
            UI.toast('Image Generation is not available for guests. Please log in.', 'error');
            this.isLoading = false;
            return;
        }

        const prompt = text;
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
        const aiMsg = {
            role: 'assistant',
            content: `إليك الصورة التي طلبتها:\n\n![${prompt}](${imageUrl})`,
            time: this.now()
        };
        this.messages.push(aiMsg);
        this.appendMessage(aiMsg, true);
        this.saveData();

        input.value = '';
        input.style.height = 'auto';
        if (localStorage.getItem('autoscroll') !== 'false') {
          const container = document.getElementById('messages');
          setTimeout(() => container.scrollTop = container.scrollHeight, 100);
        }
        return;
    }

    const activeChatId = this.currentChatId;
    const useDeepThinking = this.shouldUseDeepThinking(text);
    this.setResponseState(true);
    const typingUI = this.showTyping({ deepThinking: useDeepThinking });
    try {
      const apiMessages = [{ role: 'system', content: `${this.systemPrompts[this.currentMode] || this.systemPrompts['general']}\n\n${this.getIdentityPrompt()}` }];
      if (useDeepThinking) {
        apiMessages.push({
          role: 'system',
          content: 'This request is complex. Use deliberate internal reasoning, verify assumptions, and return a clear final answer with concise rationale and practical next steps. Do not reveal private chain-of-thought or hidden reasoning tokens.'
        });
        const status = typingUI.querySelector('.typing-status-text');
        if (status) status.textContent = 'جارٍ تحليل المهمة واختيار مستوى التفكير المناسب...';
      }
      const webToggle = document.getElementById('web-search-toggle');
      let isWebSearch = Boolean((webToggle && webToggle.checked) || this.currentMode === 'web-search');
      if (isWebSearch) {
        const taskType = typeof RouterPlugin !== 'undefined' ? await RouterPlugin.analyze(text) : 'general';
        const needsDeepSearch = taskType === 'RESEARCH' || text.toLowerCase().includes('بحث') || text.toLowerCase().includes('search');
        if (needsDeepSearch) {
          typingUI.querySelector('.typing-status-text').textContent = 'جاري استخدام الذكاء في البحث والتحليل العميق...';
          const thinkingRes = await ThinkingPlugin.think(text, this.currentModel, (msg) => {
            typingUI.querySelector('.typing-status-text').textContent = msg;
          });
          const searchResults = await SearchPlugin.search(text, taskType === 'RESEARCH' ? 'scientific' : 'general');
          const filtered = SearchPlugin.filterResults(searchResults);
          if (filtered.length > 0) {
          const searchContext = filtered.map(r => `[المصدر: ${r.source}] ${r.title}\n${r.content}\nرابط: ${r.url}`).join('\n\n');
            apiMessages.push({
              role: 'system',
              content: `--- نتائج البحث المباشر (2026) ---\n${searchContext}\n\nأجب بدقة بناءً على المعلومات أعلاه.`
            });
          } else {
            apiMessages.push({ role: 'system', content: 'No reliable live source was returned for this search. Do not infer that an event did not happen. State that verification was unavailable and ask for a more specific query if needed.' });
          }
        } else {
          typingUI.querySelector('.typing-status-text').textContent = 'جارٍ التحقق من مصادر الإنترنت المفتوحة...';
          const searchResults = await SearchPlugin.search(text, 'general');
          const filtered = SearchPlugin.filterResults(searchResults);
          if (filtered.length > 0) {
            const searchContext = filtered.map(r => `[المصدر: ${r.source}] ${r.title}\n${r.content}\nرابط: ${r.url}`).join('\n\n');
            apiMessages.push({ role: 'system', content: `--- مصادر الإنترنت المفتوحة ---\n${searchContext}\n\nاعتمد على هذه المصادر في الإجابة، واذكر اسم المصدر عند تقديم معلومة حديثة.` });
          } else {
            apiMessages.push({ role: 'system', content: 'No reliable live source was returned for this search. Do not claim that a current event did not happen without a source.' });
          }
        }
      }
      if (window.MemoryPlugin) {
        const recalled = await MemoryPlugin.recall(text);
        if (recalled.length > 0) {
            apiMessages.push({ role: 'system', content: `--- من الذاكرة ---\n${recalled.map(f => f.content).join('\n')}` });
        }
      }
      if (this.uploadedFiles.length > 0) {
        let fileContext = '';
        for (const f of this.uploadedFiles) {
          if (f.type.startsWith('image/')) {
             try {
                typingUI.querySelector('.typing-status-text').textContent = 'جاري تحليل وقراءة الصورة...';
                const formData = new FormData();
                formData.append('base64image', f.content);
                formData.append('language', 'ara');
                const ocrRes = await fetch('https://api.ocr.space/parse/image', {
                   method: 'POST',
                   headers: { 'apikey': 'K83471013788957' },
                   body: formData
                });
                const ocrData = await ocrRes.json();
                if (ocrData && ocrData.ParsedResults && ocrData.ParsedResults[0]) {
                   fileContext += `[تم استخراج هذا النص من الصورة المرفقة ${f.name}]:\n${ocrData.ParsedResults[0].ParsedText}\n\n`;
                } else {
                   fileContext += `[ملاحظة النظام: يوجد صورة مرفقة واسمها ${f.name} ولكن لم يتم التعرف على نصوص واضحة بداخلها]\n`;
                }
             } catch (e) { console.error('OCR Error', e); }
          } else {
             const content = typeof FilePlugin !== 'undefined' && FilePlugin.processFile ? await FilePlugin.processFile(f) : '';
             fileContext += `[محتوى الملف: ${f.name}]\n${content}\n\n`;
          }
        }
        apiMessages.push({ role: 'system', content: fileContext });
      }
      const { apiUrl, apiKey, actualModelId, family } = this.getApiConfig();
      if (!apiKey && family !== 'local' && family !== 'pollinations') {
        typingUI.remove();
        const noKeyMsg = { role: 'assistant', content: `[UI_WIDGET:API_KEY_REQ:${family}]`, time: this.now() };
        if (this.currentChatId === activeChatId) {
            this.messages.push(noKeyMsg);
            this.appendMessage(noKeyMsg, true);
        } else {
            const chat = this.chats.find(c => c.id === activeChatId);
            if (chat) chat.messages.push(noKeyMsg);
        }
        this.finishResponse();
        return;
      }

      let chatMsgs = this.currentChatId === activeChatId ? this.messages : (this.chats.find(c => c.id === activeChatId)?.messages || []);
      apiMessages.push(...chatMsgs.map(m => ({ role: m.role, content: m.content })));

      const temp = parseFloat(document.getElementById('temp-slider')?.value) || 0.7;
      const maxTok = parseInt(document.getElementById('max-tokens')?.value) || 4096;
      let aiContent = '';
      if (family === 'local' && window.LocalAIPlugin) {
        aiContent = await LocalAIPlugin.callLocal({ provider: actualModelId.includes('Ollama') ? 'ollama' : 'lmstudio', actualId: actualModelId }, text);
      } else {
        const reqBody = this.buildRequestBody(family, actualModelId, apiMessages, temp, maxTok, { deepThinking: useDeepThinking });

        let response;
        let retries = 3;
        while (retries > 0) {
          try {
            response = await fetch(apiUrl, {
              method: 'POST',
              headers: this.buildAuthHeaders(family, apiKey),
              body: JSON.stringify(reqBody)
            });
            if (response.ok) break;
            // أخطاء المفتاح أو النموذج أو الصلاحيات لا تتحسن بإعادة الطلب ثلاث مرات.
            if (response.status !== 429 && response.status < 500) break;
            if (retries === 1) break;
          } catch (e) {
            if (retries === 1) throw e;
          }
          retries--;
          await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
        }

        if (!response || !response.ok) {
          let errMessage = `HTTP error!`;
          if (response) {
             const errData = await response.json().catch(() => ({}));
             errMessage = errData.error?.message || `HTTP ${response.status}`;
             if (family === 'gemini' && response.status === 401) {
               errMessage = 'مفتاح Gemini غير صالح أو غير مفعّل لمشروع Google AI Studio.';
             } else if (family === 'gemini' && response.status === 404) {
               errMessage = `نموذج Gemini "${actualModelId}" غير متاح لهذا المفتاح أو المنطقة.`;
             }
          }
          throw new Error(errMessage);
        }
        const data = await response.json();
        aiContent = this.parseAIResponse(family, data);
      }
      typingUI.remove();
      const aiMsg = { role: 'assistant', content: aiContent, time: this.now() };

      if (this.currentChatId === activeChatId) {
          this.messages.push(aiMsg);
          this.appendMessage(aiMsg, true);
      } else {
          const chat = this.chats.find(c => c.id === activeChatId);
          if (chat) chat.messages.push(aiMsg);
      }


      if (chatMsgs.length === 2 && !this.isIncognito) {

        this.generateChatTitle(activeChatId, text);
      }
      if (window.MemoryPlugin && aiContent.length > 100) {
        MemoryPlugin.saveFact(aiContent, [actualModelId]);
      }
    } catch (err) {
      if (!this._retryCount) this._retryCount = 0;
      this._retryCount++;
      if (this._retryCount <= 3) {
        typingUI.remove();
        const retryTyping = this.showTyping();
        try {
          let retryConfig = this.getApiConfig();
          if (this._retryCount === 3) {
            const apiModels = this.models.filter(m => !m.free && this.getApiKeyForFamily(m.family));
            if (apiModels.length > 0) {
              this.currentModel = apiModels[0].id;
              retryConfig = this.getApiConfig();
            }
          }
          const { apiUrl: rUrl, apiKey: rKey, actualModelId: rModel, family: rFamily } = retryConfig;
          if (rKey || rFamily === 'pollinations') {
            const retryMsgs = [{ role: 'system', content: `${this.systemPrompts[this.currentMode] || this.systemPrompts['general']}\n\n${this.getIdentityPrompt()}` }];
            let chatMsgs = this.currentChatId === activeChatId ? this.messages : (this.chats.find(c => c.id === activeChatId)?.messages || []);
            retryMsgs.push(...chatMsgs.map(m => ({ role: m.role, content: m.content })));
            const rResp = await fetch(rUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${rKey}` },
              body: JSON.stringify({ model: rModel, messages: retryMsgs, max_tokens: 4096 })
            });
            if (rResp.ok) {
              const rData = await rResp.json();
              const rContent = this.parseAIResponse(rFamily, rData);
              retryTyping.remove();
              const aiMsg = { role: 'assistant', content: rContent, time: this.now() };

              if (this.currentChatId === activeChatId) {
                  this.messages.push(aiMsg);
                  this.appendMessage(aiMsg, true);
              } else {
                  const chat = this.chats.find(c => c.id === activeChatId);
                  if (chat) chat.messages.push(aiMsg);
              }

              this._retryCount = 0;
              this.uploadedFiles = [];
              this.saveData();
              this.finishResponse();
              return;
            }
          }
          retryTyping.remove();
        } catch(e2) { }
      }
      this._retryCount = 0;
      typingUI.remove();
      const errMsg = { role: 'assistant', content: `عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى أو تغيير النموذج.\n\n<small style="color:var(--text3)">التفاصيل: ${err.message}</small>`, time: this.now() };
      if (this.currentChatId === activeChatId) {
          this.messages.push(errMsg);
          this.appendMessage(errMsg, true);
      } else {
          const chat = this.chats.find(c => c.id === activeChatId);
          if (chat) chat.messages.push(errMsg);
      }
    }
    this.uploadedFiles = [];
    this.saveData();
    this.finishResponse();
  },
  appendMessage(msg, animate) {
    const container = document.getElementById('messages');
    const isUser = msg.role === 'user';
    const div = document.createElement('div');
    div.className = `msg-wrap ${isUser ? 'user' : ''}`;
    div.dataset.messageIndex = this.messages.indexOf(msg);
    let htmlContent = '';
    if (!isUser && msg.content && msg.content.includes('[UI_WIDGET:VIDEO_DOWNLOAD:')) {
        const match = msg.content.match(/\[UI_WIDGET:VIDEO_DOWNLOAD:([^:]+):(.+?)\]/);
        if (match) {
            const wId = match[1];
            const wUrl = match[2].trim();
            msg.videoWidgetId = msg.videoWidgetId || wId;
            msg.videoUrl = msg.videoUrl || wUrl;
            if (msg.videoDownload?.status === 'completed') {
              htmlContent = this.buildMediaPlayer(wId, msg.videoDownload.type, msg.videoDownload.file, msg.videoDownload.title || msg.videoTitle || '');
            } else if (msg.videoDownload?.status === 'downloading') {
              htmlContent = this.buildDownloadProgress(wId, msg.videoDownload.type);
            } else if (msg.videoDownload?.status === 'error') {
              htmlContent = this.buildDownloadError(msg.videoDownload.error || 'تعذر التحميل.');
            } else {
              htmlContent = `<div style="margin-bottom:6px;font-size:13px;color:var(--text2);">اكتشفت رابط فيديو &mdash; اختر ما تريد:</div>` + this.buildVideoWidget(wId, wUrl, null);
              setTimeout(() => this.handleVideoUrl(wUrl, wId), 300);
            }
        }
    } else if (!isUser && msg.content && msg.content.includes('[UI_WIDGET:API_KEY_REQ:')) {
      const match = msg.content.match(/\[UI_WIDGET:API_KEY_REQ:([^\]]+)\]/);
      if (match) {
        let keyName = modelFamily.toUpperCase();
        let placeholder = 'sk-...';
          link = 'https://platform.openai.com/api-keys';
        if (modelFamily === 'openai') {
          steps = '1. سجل دخولك في <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent)">موقع OpenAI</a><br>2. اضغط على Create new secret key<br>3. انسخ المفتاح والصقه هنا';
          keyName = 'OpenAI (GPT-4)';
          link = 'https://aistudio.google.com/app/apikey';
        } else if (modelFamily === 'gemini') {
          link = 'https://aistudio.google.com/app/apikey';
          steps = '1. اذهب إلى <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent)">Google AI Studio</a><br>2. اضغط على Create API key<br>3. انسخ المفتاح من المشروع';
          placeholder = 'AIzaSy...';
          link = 'https://console.anthropic.com/settings/keys';
        } else if (modelFamily === 'anthropic') {
          steps = '1. افتح <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--accent)">منصة Anthropic</a><br>2. قم بتوليد مفتاح جديد والصقه هنا';
          keyName = 'Anthropic Claude';
          link = 'https://console.groq.com/keys';
        } else if (modelFamily === 'groq') {
          link = 'https://console.groq.com/keys';
          steps = '1. ادخل إلى <a href="https://console.groq.com/keys" target="_blank" style="color:var(--accent)">Groq Console</a><br>2. أنشئ مفتاحاً مجانياً والصقه للبدء بسرعة خيالية';
          placeholder = 'gsk_...';
          link = 'https://platform.deepseek.com/';
        } else if (modelFamily === 'deepseek') {
          steps = '1. اذهب إلى <a href="https://platform.deepseek.com/" target="_blank" style="color:var(--accent)">DeepSeek Platform</a><br>2. استخرج المفتاح من قسم الـ API Keys';
          keyName = 'DeepSeek';
          steps = '1. اذهب إلى <a href="https://platform.deepseek.com/" target="_blank" style="color:var(--accent)">DeepSeek Platform</a><br>2. استخرج المفتاح من قسم الـ API Keys';
        }
        const isExpired = match[1].includes('EXPIRED');
        const uid = 'key_' + Date.now();
        htmlContent = `
          <div class="api-key-inline-widget" style="background:var(--bg-panel); border:1px solid var(--border); border-radius:16px; padding:20px; box-shadow:0 8px 32px rgba(0,0,0,0.1);">
            <div class="widget-header" style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
              <div class="widget-icon" style="background:var(--bg3); padding:12px; border-radius:12px;"><i data-lucide="${isExpired ? 'alert-triangle' : 'key'}" style="width:24px;height:24px;color:var(--accent)"></i></div>
              <div>
                <div class="widget-title" style="font-size:16px; font-weight:700;">${isExpired ? 'المفتاح منتهي أو غير صالح' : 'مطلوب مفتاح API لـ ' + keyName}</div>
                <div class="widget-desc" style="font-size:13px; color:var(--text3); margin-top:4px;">${isExpired ? 'يرجى تحديث المفتاح للمتابعة' : 'لتتمكن من استخدام هذا النموذج بأعلى كفاءة، يرجى إدخال مفتاح الـ API الخاص بك.'}</div>
              </div>
            </div>
            ${isExpired ? '<div class="widget-error" style="background:rgba(239,68,68,0.1); color:var(--red); padding:10px; border-radius:8px; font-size:12px; margin-bottom:16px;"><i data-lucide="x-circle" style="width:14px;height:14px"></i> المفتاح السابق لم يعد يعمل. قد يكون منتهي الصلاحية أو تجاوز الحد.</div>' : ''}
            <div class="widget-steps" style="font-size:13px; line-height:1.6; color:var(--text2); background:var(--bg2); padding:12px; border-radius:12px; margin-bottom:16px;">
              <strong>كيف تحصل على المفتاح؟</strong><br>${steps}
            </div>
            <div class="widget-input-row" style="display:flex; gap:8px;">
              <input type="password" id="${uid}" class="settings-input" placeholder="${placeholder}" style="flex:1;">
              <button class="btn-primary" onclick="Main.saveInlineKey('${modelFamily}', document.getElementById('${uid}').value, this)">حفظ وتأكيد</button>
            </div>
          </div>
        `;
      }
    } else {
      if (!isUser && msg.content) {
        if (msg.content.includes('[SET_THEME:')) {
          const tMatch = msg.content.match(/\[SET_THEME:([^\]]+)\]/);
          if (tMatch) setTimeout(() => UI.setTheme(tMatch[1]), 10);
          msg.content = msg.content.replace(/\[SET_THEME:[^\]]+\]/g, '');
        }
        if (msg.content.includes('[SET_COLOR:')) {
          const cMatch = msg.content.match(/\[SET_COLOR:([^\]]+)\]/);
          if (cMatch) setTimeout(() => UI.setAccentColor(cMatch[1]), 10);
          msg.content = msg.content.replace(/\[SET_COLOR:[^\]]+\]/g, '');
        }
        if (msg.content.includes('[IMAGE:')) {
          msg.content = msg.content.replace(/\[IMAGE:([^\]]+)\]/g, (match, prompt) => {
            const p = prompt.trim();
            const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true`;
            return `
<div style="margin-top:16px; border-radius:12px; overflow:hidden; border:1px solid var(--border);"><img src="${imgUrl}" alt="Generated Image" style="width:100%; height:auto; display:block;"></div>
`;
          });
        }
        if (msg.content.includes('[SOURCES_JSON:')) {
          msg.content = msg.content.replace(/\[SOURCES_JSON:\s*(\[.*?\])\s*\]/g, (match, jsonStr) => {
            try {
              const sources = JSON.parse(jsonStr);
              if (!Array.isArray(sources) || sources.length === 0) return '';
              let html = '<div class="sources-container" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05);">';
              sources.forEach(s => {
                html += `<a href="${s.url}" target="_blank" class="source-card" style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); padding:8px 12px; border-radius:12px; text-decoration:none; color:var(--text); font-size:12px; transition:all 0.2s;">
                           <i data-lucide="${s.icon || 'globe'}" style="width:14px;height:14px;color:var(--accent);"></i>
                           <span style="font-weight:600;">${s.title}</span>
                         </a>`;
              });
              html += '</div>';
              return html;
            } catch (e) { return ''; }
          });
        }
      }
      htmlContent = isUser ? (msg.display || this.linkify(this.escHtml(msg.content))) : this.formatAI(msg.content || '');
    }
    let filesHtml = '';
    if (msg.files && msg.files.length && (!isUser || !msg.display)) {
      filesHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">` +
        msg.files.map(f => `<span class="attachment-chip"><i data-lucide="paperclip" style="width:12px;height:12px"></i>${this.escHtml(f)}</span>`).join('') +
        `</div>`;
    }
    const safeContent = encodeURIComponent(msg.content || '');
    const copyBtnHtml = !isUser ? `<button class="msg-copy-btn" onclick="Main.copyMessage(decodeURIComponent('${safeContent}'), this)" title="نسخ"><i data-lucide="copy" style="width:14px;height:14px"></i></button>` : '';
    const isVoiceOnly = isUser && msg.isVoiceOnly;
    const isImageOnly = isUser && msg.isImageOnly;
    const isMediaOnly = isVoiceOnly || isImageOnly || (isUser && msg.hasMedia);
    const bubbleClass = isMediaOnly ? 'msg-bubble user transparent-bubble' : (isUser ? 'msg-bubble user' : 'msg-bubble ai');
    const userActionsHtml = `
          <div class="msg-actions">
            <button class="msg-action-btn" title="تعديل السؤال" onclick="Main.editMessage(this)"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
          </div>`;
    div.innerHTML = `
      <div class="msg-avatar ${isUser ? 'user' : 'ai'}">
        ${isUser ? '<i data-lucide="user" style="width:18px;height:18px"></i>' : '<img src="ai_avatar.png" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="AI">'}
      </div>
      <div class="msg-body">
        <div class="${bubbleClass}">
          ${copyBtnHtml}
          ${filesHtml}
          <div class="msg-content-wrapper"></div>
        </div>
        <div class="msg-meta">
          ${isUser ? '<span class="msg-owner-label"><i data-lucide="user-round"></i> أنت</span>' : '<span class="msg-owner-label ai-owner"><i data-lucide="sparkles"></i> AI Agent Pro</span>'}
          <span class="msg-time">${msg.time}</span>
          ${!isUser ? `
          <div class="msg-actions">
            <button class="msg-action-btn like-btn" title="أعجبني" onclick="Main.toggleLike(this)"><i data-lucide="thumbs-up" style="width:14px;height:14px"></i></button>
            <button class="msg-action-btn dislike-btn" title="لم يعجبني" onclick="Main.toggleDislike(this)"><i data-lucide="thumbs-down" style="width:14px;height:14px"></i></button>
            <button class="msg-action-btn" title="نسخ" onclick="Main.copyBubbleText(this)"><i data-lucide="copy" style="width:14px;height:14px"></i></button>
            <button class="msg-action-btn" title="قراءة الصوت" onclick="Main.speak(this)"><i data-lucide="volume-2" style="width:14px;height:14px"></i></button>
            <button class="msg-action-btn" title="إعادة التوليد" onclick="Main.regenerate()"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i></button>
          </div>` : userActionsHtml}
        </div>
      </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
    const contentWrapper = div.querySelector('.msg-content-wrapper');
    if (animate && !isUser && htmlContent) {
      Main.typeRealisticHTML(contentWrapper, htmlContent);
    } else {
      contentWrapper.innerHTML = htmlContent;
      div.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    }

    if (localStorage.getItem('autoscroll') !== 'false') {
      container.scrollTop = container.scrollHeight;
    }
  },
  toggleLike(btn) {
    const parent = btn.closest('.msg-actions');
    const dislikeBtn = parent.querySelector('.dislike-btn');
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
    } else {
      btn.classList.add('active');
      if (dislikeBtn) dislikeBtn.classList.remove('active', 'dislike');
      UI.toast('شكرًا لتقييمك الإيجابي!', 'success');
    }
  },
  toggleDislike(btn) {
    const parent = btn.closest('.msg-actions');
    const likeBtn = parent.querySelector('.like-btn');
    if (btn.classList.contains('active')) {
      btn.classList.remove('active', 'dislike');
    } else {
      btn.classList.add('active', 'dislike');
      if (likeBtn) likeBtn.classList.remove('active');
      UI.toast('تم تسجيل التقييم لتطوير النظام', 'info');
    }
  },
  typeRealisticHTML(element, html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const textNodes = [];
    const walk = (node) => {
      if (node.nodeType === 3) {
        if (node.nodeValue.trim() !== '' || node.nodeValue.includes('\\n')) {
          textNodes.push(node);
        }
      } else {
        Array.from(node.childNodes).forEach(child => walk(child));
      }
    };
    walk(tempDiv);

    textNodes.forEach(n => {
      n._originalText = n.nodeValue;

      n._words = n.nodeValue.split(/(\\s+)/);
      n.nodeValue = '';
    });

    element.innerHTML = '';
    element.appendChild(tempDiv);

    let nodeIndex = 0;
    let wordIndex = 0;
    const container = document.getElementById('messages');

    const type = () => {
      if (nodeIndex >= textNodes.length) {
        element.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
        return;
      }
      const node = textNodes[nodeIndex];
      const words = node._words;

      if (wordIndex < words.length) {
        let chunk = 2;
        let appended = '';
        for (let i = 0; i < chunk && wordIndex < words.length; i++) {
          appended += words[wordIndex];
          wordIndex++;
        }
        node.nodeValue += appended;


        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isAtBottom && localStorage.getItem('autoscroll') !== 'false') {
          container.scrollTop = container.scrollHeight;
        }

        let delay = 10 + Math.random() * 20;
        setTimeout(type, delay);
      } else {
        nodeIndex++;
        wordIndex = 0;
        type();
      }
    };
    type();
  },
  editMessage(btn) {
    const msgWrap = btn.closest('.msg-wrap');
    if (!msgWrap) return;
    const index = Number(msgWrap.dataset.messageIndex);
    const message = this.messages[index];
    if (!message) return;

    const input = document.getElementById('chat-input');
    // استخدم محتوى الرسالة الأصلي بدلاً من قراءة واجهة المستخدم لتجنب وقت الصوت
    input.value = message.content || '';

    if (message.files && message.files.length > 0) {
      this.uploadedFiles = message.files.map(file => ({ ...file }));
      this.renderAttachments();
    }
    input.focus();
    if (window.innerWidth <= 768) {
      input.style.height = 'auto';
      input.style.height = (input.scrollHeight) + 'px';
    }
  },
  async generateChatTitle(chatId, firstUserMessage) {
    try {
      const config = this.getApiConfig();
      if (!config.apiKey && config.family !== 'local' && config.family !== 'pollinations') return;
      const prompt = `اكتب عنواناً قصيراً جداً (من كلمتين إلى 4 كلمات كحد أقصى) يعبر عن هذه الرسالة: "${firstUserMessage}". اكتب العنوان فقط بدون أي إضافات أو اقتباسات.`;

      let title = '';
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: this.buildAuthHeaders(config.family, config.apiKey),
        body: JSON.stringify(this.buildRequestBody(
          config.family,
          config.actualModelId,
          [{ role: 'user', content: prompt }],
          0.7,
          20
        ))
      });
      if (response.ok) {
        const data = await response.json();
        title = this.parseAIResponse(config.family, data);
      }

      if (title) {
        title = title.replace(/['"]/g, '').trim();
        const chatListStr = localStorage.getItem('chatList');
        if (chatListStr) {
          const chats = JSON.parse(chatListStr);
          const chat = chats.find(c => c.id === chatId);
          if (chat) {
            chat.name = title;
            localStorage.setItem('chatList', JSON.stringify(chats));
            this.renderChatList();
          }
        }
      }
    } catch(err) {
      console.warn('Title generation failed:', err);
    }
  },
  formatAI(text) {
    let processed = text.replace(/```([a-z0-9+#]*)[^\\n]*\\n([\\s\\S]*?)```/gi, (match, lang, code) => {
      lang = lang ? lang.toLowerCase() : 'text';
      let icon = 'file-code';
      let color = '#fff';
      if (lang === 'html') { icon = 'file-code-2'; color = '#E34F26'; }
      else if (lang === 'css') { icon = 'palette'; color = '#1572B6'; }
      else if (lang === 'javascript' || lang === 'js') { icon = 'file-json'; color = '#F7DF1E'; }
      else if (lang === 'python' || lang === 'py') { icon = 'terminal'; color = '#3776AB'; }
      return `<div class="code-container-premium"><div class="code-header-premium"><div class="code-lang-badge"><i data-lucide="${icon}" style="width:14px;height:14px;color:${color}"></i> ${lang}</div><div class="code-actions-premium"><button type="button" class="code-action-btn"><i data-lucide="copy" style="width:12px;height:12px"></i> نسخ</button></div></div><pre><code class="language-${lang}">${this.escHtml(code)}</code></pre></div>`;
    });
    let html = marked.parse(processed);

    // Deep Thinking UI Simulation (Code Sandbox & Logic)
    if (html.includes('<think>') || (typeof this.currentModel === 'string' && this.currentModel.includes('o1'))) {
       html = html.replace(/<think>([\s\S]*?)<\/think>/g, '<div class="deep-thinking-block"><div class="dt-header"><i data-lucide="brain"></i> تفكير عميق (Deep Thinking)</div><div class="dt-content">$1</div></div>');
       // If no think tags but it's an o1 model, simulate one
       if (!html.includes('deep-thinking-block')) {
         html = '<div class="deep-thinking-block"><div class="dt-header"><i data-lucide="brain"></i> تفكير عميق...</div><div class="dt-content">جاري التحليل المعقد...</div></div>' + html;
       }
    }

    // Sandboxed Code
    if (html.includes('```')) {
      html = html.replace(/<button type="button" class="code-action-btn">/g, '<button type="button" class="code-action-btn sandbox-run-btn" onclick="alert(\'جاري تشغيل الكود في الحاوية البرمجية المعزولة...\')"><i data-lucide="play" style="width:12px;height:12px;margin-left:4px;"></i> تشغيل</button><button type="button" class="code-action-btn">');
    }

    html = html.replace(/<a href="([^"]+)"([^>]*)>(.*?)<\/a>/g, (match, url, attrs, content) => {
      if (content.includes('<div') || content.includes('<i')) return match;
      return `<a href="${url}" ${attrs} class="premium-link-btn">
                <span>${content}</span>
                <i data-lucide="external-link" style="width:14px;height:14px;margin-right:8px;opacity:0.8;"></i>
              </a>`;
    });
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data:image\/png|data:image\/jpeg|data:image\/gif|data:image\/webp):)/i
      });
    }
    return html;
  },
  showTyping(options = {}) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    const deepThinking = Boolean(options.deepThinking);
    div.className = 'msg-wrap';
    div.innerHTML = `
      <div class="msg-avatar ai"><img src="ai_avatar.png" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="AI"></div>
      <div class="msg-body">
        <div class="typing-indicator${deepThinking ? ' deep-thinking-indicator' : ''}">
          <span class="typing-status-text" style="font-size:13px;color:var(--text3);margin-left:8px;">${deepThinking ? 'يفكر بعمق في المهمة...' : 'يفكر...'}</span>
          <div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
        </div>
        ${deepThinking ? '<div class="thinking-progress" aria-label="التفكير العميق"><span></span><span></span><span></span></div>' : ''}
      </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    return div;
  },
  renderMessages() {
    try {
      const container = document.getElementById('messages');
      const welcome = document.getElementById('welcome-screen');
      if(!container) return;
      container.innerHTML = '';
      if(welcome) container.appendChild(welcome);
      if (this.messages.length === 0) {
        if(welcome) welcome.style.display = 'flex';
      } else {
        if(welcome) welcome.style.display = 'none';
        this.messages.forEach(m => {
          try { this.appendMessage(m, false); } catch(e) { console.error('Failed to append message', e); }
        });
      }
      container.style.visibility = 'visible';
      container.style.opacity = '1';
    } catch(err) {
      console.error('renderMessages error:', err);
    }
  },
  handleFiles(files) {
    Array.from(files || []).forEach(file => {
      this.handleFileSelection(file);
      UI.toast(`تم إرفاق الملف: ${file.name}`, 'success');
    });
  },

  checkLoginAndUpload() {
    const isGuest = localStorage.getItem('ai_user') === 'guest';
    if (isGuest) {
      UI.toast('يرجى تسجيل الدخول أو إنشاء حساب لرفع الملفات', 'error');
      return;
    }
    document.getElementById('file-upload').click();
  },
  handleLogoutClick() {
    const isGuest = localStorage.getItem('ai_user') === 'guest';
    if (isGuest) {
      UI.toast('أنت تستخدم كضيف، قم بإنشاء حساب للوصول لجميع الميزات', 'info');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      UI.showModal('logout-modal');
      UI.closeModal('account-modal');
    }
  },
  isListening: false,
  mediaRecorder: null,
  audioChunks: [],
  pendingVoiceTranscript: '',
  voiceTimerInterval: null,
  voiceAnimationFrame: null,
  voicePaused: false,
  voiceSeconds: 0,
  async toggleVoice() {
    const aiUser = localStorage.getItem('ai_user');
    if (!aiUser || JSON.parse(aiUser).type === 'guest') {
      UI.toast('يجب تسجيل الدخول لاستخدام ميزة التسجيل الصوتي', 'error');
      setTimeout(() => window.location.href = 'login.html', 2000);
      return;
    }
    if (this.isListening) {
      this.stopVoice();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.voiceTicks = 0;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          const audioUrl = URL.createObjectURL(audioBlob);
          this._addVoiceAsAttachment(audioBlob, audioUrl);
        }
      };
      this.mediaRecorder.start();
      this.isListening = true;
      this.voicePaused = false;
      this.pendingVoiceTranscript = '';
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ar-SA';
        this.recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              this.pendingVoiceTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
        };
        this.recognition.start();
      }
      document.getElementById('input-row-main').style.display = 'none';
      const inputContainer = document.getElementById('chat-input-container');
      if (inputContainer) inputContainer.style.display = 'none';
      document.getElementById('voice-record-ui').style.display = 'flex';
      const waveContainer = document.getElementById('voice-wave-container');
      waveContainer.innerHTML = Array.from({length: 34}, () => '<div class="voice-wave-bar"></div>').join('');
      const animateVoice = () => {
        if (!this.isListening || !this.analyser) return;
        this.analyser.getByteFrequencyData(this.dataArray);
        waveContainer.querySelectorAll('.voice-wave-bar').forEach((bar, i, bars) => {
          const sample = this.dataArray[Math.min(this.dataArray.length - 1, Math.floor((i / bars.length) * this.dataArray.length * 0.72))] / 255;
          const edgeFade = 0.64 + 0.36 * Math.sin(Math.PI * (i + 1) / (bars.length + 1));
          const level = this.voicePaused ? 0 : sample * edgeFade;
          bar.style.setProperty('height', `${Math.max(3, 3 + level * 42)}px`, 'important');
          bar.style.setProperty('opacity', `${.28 + Math.min(.72, level * 1.35)}`, 'important');
        });
        this.voiceAnimationFrame = requestAnimationFrame(animateVoice);
      };
      animateVoice();
      this.voiceTimerInterval = setInterval(() => {
        if (this.voicePaused) return;
        this.voiceTicks++;
        const totalSeconds = Math.floor(this.voiceTicks / 10);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        document.getElementById('voice-timer').textContent = `${mins}:${secs}`;
      }, 100);
    } catch (e) {
      UI.toast('تعذر الوصول للميكروفون', 'error');
    }
  },
  stopVoice() {
    if (!this.isListening) return;
    this.isListening = false;
    this.voicePaused = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    clearInterval(this.voiceTimerInterval);
    cancelAnimationFrame(this.voiceAnimationFrame);
    const btn = document.getElementById('voice-btn');
    if (btn) { btn.style.color = 'var(--text3)'; btn.classList.remove('recording-pulse'); }
    this._restoreInputRow();
  },
  stopVoiceAndSend() {
    this.stopVoice();
    setTimeout(() => this.sendMessage(), 200);
  },
  pauseVoice() {
    if (!this.isListening || !this.mediaRecorder) return;
    this.voicePaused = !this.voicePaused;
    const button = document.getElementById('voice-pause-btn');
    if (this.voicePaused) {
      if (this.mediaRecorder.state === 'recording') this.mediaRecorder.pause();
      if (this.audioContext?.state === 'running') this.audioContext.suspend();
      if (this.recognition) this.recognition.stop();
      if (button) button.innerHTML = '<i data-lucide="play" style="width:20px;height:20px"></i>';
    } else {
      if (this.mediaRecorder.state === 'paused') this.mediaRecorder.resume();
      if (this.audioContext?.state === 'suspended') this.audioContext.resume();
      if (this.recognition) { try { this.recognition.start(); } catch (e) {} }
      if (button) button.innerHTML = '<i data-lucide="pause" style="width:20px;height:20px"></i>';
    }
    lucide.createIcons();
  },
  cancelVoice() {
    if (!this.isListening) return;
    this.isListening = false;
    this.voicePaused = false;

    // Forcefully stop hardware microphone tracks immediately
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null; // Prevent saving the file
      this.mediaRecorder.stop();
    }
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    clearInterval(this.voiceTimerInterval);
    cancelAnimationFrame(this.voiceAnimationFrame);
    const btn = document.getElementById('voice-btn');
    if (btn) { btn.style.color = 'var(--text3)'; btn.classList.remove('recording-pulse'); }
    this._restoreInputRow();
    UI.toast('تم إلغاء التسجيل', 'info');
  },
  _restoreInputRow() {
    const mainRow = document.getElementById('input-row-main');
    const voiceUi = document.getElementById('voice-record-ui');
    if (mainRow) mainRow.style.display = 'flex';
    const inputContainer = document.getElementById('chat-input-container');
    if (inputContainer) inputContainer.style.display = 'flex';
    if (voiceUi) voiceUi.style.display = 'none';
  },
  _addVoiceAsAttachment(audioBlob, audioUrl) {
    const currentVoiceNotes = this.uploadedFiles.filter(f => f.isVoice).length;
    if (currentVoiceNotes >= 2) {
      UI.toast('لا يمكن إرفاق أكثر من رسالتين صوتيتين في المرة الواحدة', 'warning');
      return;
    }
    const id = 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
    const totalSeconds = Math.floor(this.voiceTicks / 10);
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    this.uploadedFiles.push({
      id,
      name: `تسجيل صوتي (${mins}:${secs})`,
      type: 'audio/webm',
      size: audioBlob.size,
      content: audioUrl,
      isVoice: true,
      voiceBlob: audioBlob,
      voiceDuration: totalSeconds,
      voiceTranscript: this.pendingVoiceTranscript || ''
    });
    this.renderAttachments();
    UI.toast('تم إضافة التسجيل الصوتي', 'success');
  },
  showVoicePreview(audioUrl) {
    const previewArea = document.getElementById('attachments-preview');
    previewArea.style.display = 'flex';
    const mins = Math.floor(this.voiceSeconds / 60).toString().padStart(2, '0');
    const secs = (this.voiceSeconds % 60).toString().padStart(2, '0');
    const bars = Array.from({ length: 24 }, () => `<div class="bar" style="height:${4 + Math.random() * 24}px"></div>`).join('');
    previewArea.innerHTML = `
      <div class="voice-preview-bar paused" id="voice-preview">
        <button class="voice-play-btn" onclick="Main.playVoicePreview(this)">
          <i data-lucide="play" style="width:16px;height:16px"></i>
        </button>
        <div class="voice-wave-bars">${bars}</div>
        <span class="voice-duration">${mins}:${secs}</span>
        <button class="voice-cancel-btn" onclick="Main.clearVoicePreview()">
          <i data-lucide="x" style="width:14px;height:14px"></i>
        </button>
      </div>
    `;
    lucide.createIcons();
    if (this.pendingVoiceTranscript) {
      console.log('Voice transcript ready:', this.pendingVoiceTranscript);
    }
  },
  openLightbox(url) {
    const lightbox = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    if (lightbox && img) {
      img.src = url;
      lightbox.style.display = 'flex';
      lucide.createIcons();
    }
  },
  playVoicePreview(btn) {
    this.playAudioMsg(btn, this.pendingVoiceUrl);
  },
  playAudioMsg(btn, url) {
    if (!url) return;
    const parent = btn.closest('.voice-message-premium') || btn.closest('.voice-preview-bar') || btn.closest('.attachment-item');
    const playBtn = btn.classList.contains('voice-play-pause') || btn.classList.contains('voice-play-btn') ? btn : (btn.querySelector('.voice-play-pause') || btn.querySelector('.voice-play-btn') || btn);
    if (!parent) return;
    const formatAudioTime = (seconds) => {
      const value = Math.max(0, Math.floor(seconds || 0));
      return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
    };
    if (this.currentAudio && this.currentAudio !== parent._audio) {
      this.currentAudio.pause();
      this.currentAudio._owner?.classList.remove('playing');
      const oldButton = this.currentAudio._owner?.querySelector('.voice-play-pause, .voice-play-btn');
      if (oldButton) oldButton.innerHTML = '<i data-lucide="play" style="width:16px;height:16px"></i>';
    }
    const audio = parent._audio || new Audio(url);
    parent._audio = audio;
    audio._owner = parent;
    const timeLabel = parent.querySelector('.voice-time');
    const renderProgress = () => {
      const progress = audio.currentTime / (audio.duration || Number(timeLabel?.dataset.duration) || 1);
      const bars = parent.querySelectorAll('.voice-wave-bar');
      const activeCount = Math.floor(progress * bars.length);
      bars.forEach((bar, index) => bar.style.setProperty('opacity', index <= activeCount ? '1' : '.22', 'important'));
      if (timeLabel) timeLabel.textContent = `${formatAudioTime(audio.currentTime)} / ${formatAudioTime(audio.duration || Number(timeLabel.dataset.duration))}`;
    };
    if (!audio.paused) {
      audio.pause();
      parent.classList.remove('playing');
      playBtn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px"></i>';
      lucide.createIcons();
      return;
    }
    this.currentAudio = audio;
    audio.play();
    parent.classList.add('playing');
    playBtn.innerHTML = '<i data-lucide="pause" style="width:16px;height:16px"></i>';
    lucide.createIcons();
    audio.ontimeupdate = renderProgress;
    audio.onloadedmetadata = renderProgress;
    audio.onended = () => {
      playBtn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px;margin-left:2px;"></i>';
      parent.classList.remove('playing');
      parent.querySelectorAll('.voice-wave-bar').forEach(bar => bar.style.setProperty('opacity', '.22', 'important'));
      if (timeLabel) timeLabel.textContent = `00:00 / ${formatAudioTime(audio.duration)}`;
      lucide.createIcons();
    };
  },
  seekAudio(event, element) {
    event.stopPropagation();
    const parent = element.closest('.voice-message-premium');
    const audio = parent?._audio;
    if (!audio?.duration) return;
    const rect = element.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(audio.duration, ((event.clientX - rect.left) / rect.width) * audio.duration));
  },
  sendCodeToEditor(btnEl, lang) {
    const code = btnEl.closest('.code-container-premium').querySelector('code').innerText;
    let ext = { html: 'html', css: 'css', javascript: 'js', js: 'js', typescript: 'ts', python: 'py', py: 'py' }[lang] || 'txt';
    let name = `file_${Date.now()}.${ext}`;
    if (Editor.tabs.length > 0) {
      const activeTab = Editor.tabs.find(t => t.id === Editor.activeTab);
      if (activeTab) {
        activeTab.content = code;
        activeTab.lang = lang;
        Editor.switchTab(Editor.activeTab);
        UI.toast('تم تحديث الملف الحالي في المحرر', 'success');
        if (!Editor.isOpen) Editor.toggleSplitScreen();
        return;
      }
    }
    Editor.createTab(name, code, lang);
    if (!Editor.isOpen) Editor.toggleSplitScreen();
    UI.toast('تم إرسال الكود لملف جديد في المحرر', 'success');
  },
  downloadCodeBlock(btnEl, lang) {
    const code = btnEl.closest('.code-container-premium').querySelector('code').innerText;
    let ext = { html: 'html', css: 'css', javascript: 'js', js: 'js', typescript: 'ts', python: 'py', py: 'py' }[lang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code_block_${Date.now()}.${ext}`;
    a.click();
    UI.toast('تم التحميل بنجاح', 'success');
  },
  copyLink() {
    navigator.clipboard.writeText(window.location.href + '?chat=' + this.currentChatId);
    UI.toast('تم نسخ رابط المحادثة', 'success');
    UI.toggleShare();
  },
  copyText() {
    const txt = this.messages.map(m => `[${m.role}]: ${m.display || m.content}`).join('\n\n');
    navigator.clipboard.writeText(txt);
    UI.toast('تم نسخ نص المحادثة كاملة', 'success');
    UI.toggleShare();
  },
  exportChat(type) {
    const element = document.getElementById('messages');
    if (type === 'json') {
      const payload = {
        exportedAt: new Date().toISOString(),
        chatId: this.currentChatId,
        messages: this.messages.map(m => ({
          role: m.role,
          content: typeof m.display === 'string' ? m.display : m.content,
          time: m.time || null
        }))
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `chat_${this.currentChatId}.json`;
      a.click();
      UI.toast('تم تنزيل JSON', 'success');
      UI.toggleShare();
      return;
    }
    if (type === 'pdf') {
      UI.toast('جاري تحضير ملف PDF...', 'info');
      html2pdf().from(element).set({
        margin: 10,
        filename: `chat_${this.currentChatId}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save().then(() => UI.toast('تم تحميل ملف PDF', 'success'));
    } else {
      const text = this.messages.map(m => `## ${m.role === 'user' ? 'المستخدم' : 'الذكاء الاصطناعي'}\
${m.display || m.content}`).join('\
\
---\
');
      const blob = new Blob([text], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `chat_${this.currentChatId}.md`;
      a.click();
      UI.toast('تم تحميل ملف Markdown', 'success');
    }
    UI.toggleShare();
  },
  searchMessages(q) {
    if (!q) { this.renderMessages(); return; }
    const filtered = this.messages.filter(m => (m.display || m.content).toLowerCase().includes(q.toLowerCase()));
    const container = document.getElementById('messages');
    container.innerHTML = '';
    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">لا يوجد نتائج مطابقة في هذه المحادثة</div>';
      return;
    }
    filtered.forEach(m => this.appendMessage(m, false));
  },
  updateStatsUI() {
    const msgsEl = document.getElementById('stat-msgs');
    if (msgsEl) msgsEl.textContent = this.stats.msgs;
    const chatsEl = document.getElementById('stat-chats');
    if (chatsEl) chatsEl.textContent = this.stats.chats;
    const s = this.stats;
    document.getElementById('stats-msgs') && (document.getElementById('stats-msgs').textContent = s.msgs);
    document.getElementById('stats-tokens') && (document.getElementById('stats-tokens').textContent = s.tokens + 'k');
    const estCost = ((s.tokens) * 0.001).toFixed(3);
    if (document.getElementById('stats-cost')) {
      document.getElementById('stats-cost').textContent = '$' + estCost;
    }
  },
  updateStorageUI() {
    const pct = Math.min((this.totalStorage / (50 * 1024 * 1024)) * 100, 100);
    if (document.getElementById('storage-fill')) document.getElementById('storage-fill').style.width = pct + '%';
    if (document.getElementById('storage-used')) document.getElementById('storage-used').textContent = `${this.formatSize(this.totalStorage)} / 50 MB`;
    if (document.getElementById('storage-pct')) document.getElementById('storage-pct').textContent = pct.toFixed(1) + '%';
  },
  now() {
    return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  },
  relativeTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} ي`;
    if (days < 30) return `منذ ${Math.floor(days/7)} أ`;
    return new Date(ts).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  },
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },
  linkify(text) {
    if (!text) return '';
    return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:#3b82f6; text-decoration:underline; font-weight:bold;">$1</a>');
  },
  escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  scrollToBottom() {
    const msgs = document.getElementById('messages');
    msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
  },
  setupScrollWatcher() {
    const msgs = document.getElementById('messages');
    const btn = document.getElementById('scroll-bottom-btn');
    if (!msgs || !btn) return;
    msgs.addEventListener('scroll', () => {
      const distFromBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight;
      btn.style.display = distFromBottom > 200 ? 'flex' : 'none';
    });
  },
  copyMessage(text, btnEl) {
    navigator.clipboard.writeText(text).then(() => {
      btnEl.classList.add('copied');
      btnEl.innerHTML = '<i data-lucide="check" style="width:14px;height:14px"></i>';
      lucide.createIcons();
      setTimeout(() => {
        btnEl.classList.remove('copied');
        btnEl.innerHTML = '<i data-lucide="copy" style="width:14px;height:14px"></i>';
        lucide.createIcons();
      }, 2000);
    });
  },
  saveInlineKey(family, value, btnEl) {
    if (!value || value.trim() === '') {
      UI.toast('يرجى إدخال المفتاح', 'error');
      return;
    }
    const keys = JSON.parse(localStorage.getItem(`api_keys_${family}`) || '[]');
    if (!keys.includes(value.trim())) {
      keys.unshift(value.trim());
      localStorage.setItem(`api_keys_${family}`, JSON.stringify(keys));
    }
    const inputId = 'new-key-' + family;
    const el = document.getElementById(inputId);
    if (el) el.value = value.trim();
    UI.toast('تم تفعيل المفتاح بنجاح! جاري إرسال طلبك...', 'success');
    btnEl.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i> تم الحفظ';
    btnEl.style.background = 'var(--green)';
    btnEl.style.color = '#fff';
    lucide.createIcons();
    setTimeout(() => {
      this.regenerate();
    }, 500);
  },
  setupNetworkMonitor() {
    // Disabled as per user request.
  },
  recoverInput() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    sessionStorage.removeItem('draft_input');
    input.value = '';
    input.placeholder = 'اسأل AI Agent Pro...';
  },

  regenerate() {
    if (!this.messages || this.messages.length < 2) return;
    let lastUserIndex = -1;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const lastUserMsg = this.messages[lastUserIndex];
    this.messages.splice(lastUserIndex);

    if (this.currentChatId && this.chats) {
       const chat = this.chats.find(c => c.id === this.currentChatId);
       if (chat && chat.messages) {
           chat.messages = [...this.messages];
       }
    }

    this.renderChat();

    const input = document.getElementById('chat-input');
    if (input) input.value = lastUserMsg.content || '';

    if (lastUserMsg.files) {
      this.uploadedFiles = JSON.parse(JSON.stringify(lastUserMsg.files));
      this.renderAttachments();
    }

    this.sendMessage();
  },
  setupLayoutObservers() {
    const composer = document.querySelector('.input-box');
    if (composer && window.ResizeObserver) {
      new ResizeObserver(([entry]) => {
        document.documentElement.style.setProperty('--composer-height', `${Math.ceil(entry.contentRect.height)}px`);
      }).observe(composer);
    }
    if (window.IntersectionObserver) {
      this.messageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.target.classList.toggle('message-visible', entry.isIntersecting));
      }, { root: document.getElementById('messages'), threshold: 0.08 });
    }
  },
  observeMessageMotion() {
    if (!this.messageObserver) return;
    document.querySelectorAll('.msg-wrap').forEach(message => this.messageObserver.observe(message));
  },
  logout() {
    UI.showModal('logout-modal');
  },
  confirmLogout() {
    const clearChats = document.getElementById('logout-clear-chats')?.checked;
    const clearKeys = document.getElementById('logout-clear-keys')?.checked;
    const clearAll = document.getElementById('logout-clear-all')?.checked;
    if (clearAll) {
      localStorage.clear();
    } else {
      if (clearChats) {
        localStorage.removeItem('ai_chats_pro');
      }
      if (clearKeys) {
        ['openai', 'gemini', 'groq', 'anthropic', 'mistral', 'deepseek', 'xai', 'alibaba', 'perplexity'].forEach(k => {
          localStorage.removeItem(`api_keys_${k}`);
        });
      }
    }
    localStorage.removeItem('ai_logged_in');
    localStorage.removeItem('ai_user');
    if (typeof firebaseAuth !== 'undefined') {
      firebaseAuth.signOut().then(() => {
        window.location.href = 'login.html';
      }).catch(() => {
        window.location.href = 'login.html';
      });
    } else {
      window.location.href = 'login.html';
    }
  },
  deleteAccount() {
    if (this.isGuest()) {
      UI.toast('يجب تسجيل حساب أولاً قبل حذفه. أنت تستخدم المنصة كضيف.', 'error');
      setTimeout(() => {
        if (confirm('هل تريد إنشاء حساب الآن؟')) {
          window.location.href = 'login.html?action=register';
        }
      }, 1500);
      return;
    }
    if (!confirm('⚠️ تحذير: سيتم حذف حسابك وجميع بياناتك نهائياً. هل أنت متأكد؟')) return;
    if (!confirm('هذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟')) return;
    localStorage.clear();
    if (typeof firebaseAuth !== 'undefined' && firebaseAuth.currentUser) {
      firebaseAuth.currentUser.delete().then(() => {
        UI.toast('تم حذف الحساب بنجاح', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      }).catch(err => {
        UI.toast('خطأ في حذف الحساب: ' + err.message, 'error');
        window.location.href = 'login.html';
      });
    } else {
      UI.toast('تم مسح جميع البيانات المحلية', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    }
  },
  switchAccount() {
    if (typeof firebaseAuth !== 'undefined') {
      firebaseAuth.signOut().then(() => {
        localStorage.removeItem('ai_logged_in');
        localStorage.removeItem('ai_user');
        window.location.href = 'login.html?action=switch';
      }).catch(() => {
        window.location.href = 'login.html';
      });
    } else {
      localStorage.removeItem('ai_logged_in');
      localStorage.removeItem('ai_user');
      window.location.href = 'login.html';
    }
  }
};
window.addEventListener('DOMContentLoaded', () => Main.init());
