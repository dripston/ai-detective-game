// ===== AI Detective — Main Game Logic =====

const CHARACTER_POOL = [
  { id: 'street-boy', name: 'Viktor "Knuckles" Petrov', type: 'young-male' },
  { id: 'scared-boy', name: 'Eddie Marsh', type: 'young-male' },
  { id: 'bald-uncle', name: 'Don Enzo Moretti', type: 'old-male' },
  { id: 'calm-uncle', name: 'Richard Ashford III', type: 'old-male' },
  { id: 'modern-girl', name: 'Scarlett Dubois', type: 'young-female' },
  { id: 'athletic-girl', name: 'Maya "Ace" Torres', type: 'young-female' },
  { id: 'old-aunty', name: 'Beatrice Harmon', type: 'old-female' },
  { id: 'modern-aunty', name: 'Vivienne LaRoux', type: 'old-female' },
];

function pickSuspects(count = 5) {
  const shuffled = [...CHARACTER_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const state = {
  suspects: [], activeSuspect: null, isTalking: false, talkInterval: null,
  timerInterval: null, elapsedSeconds: 0, introTyping: null, introSkipped: false,
  gameMode: null, language: 'en', difficulty: null, accusedSuspect: null, guiltyIndex: null,
};

const $landing = document.getElementById('landing');
const $landingCta = document.getElementById('landing-cta');
const $modeSelect = document.getElementById('mode-select');
const $modeText = document.getElementById('mode-text');
const $modeVoice = document.getElementById('mode-voice');
const $langSelect = document.getElementById('lang-select');
const $langGrid = document.getElementById('lang-grid');
const $langBack = document.getElementById('lang-back');
const $diffSelect = document.getElementById('diff-select');
const $diffBack = document.getElementById('diff-back');
const $diffStep = document.getElementById('diff-step');
const $textModeNotice = document.getElementById('text-mode-notice');
const $gameIntro = document.getElementById('game-intro');
const $introStamp = document.getElementById('intro-stamp');
const $introCaseNumber = document.getElementById('intro-case-number');
const $introDate = document.getElementById('intro-date');
const $introText = document.getElementById('intro-text');
const $introProgressBar = document.getElementById('intro-progress-bar');
const $beginBtn = document.getElementById('begin-btn');
const $skipBtn = document.getElementById('skip-btn');
const $introCursor = document.querySelector('.intro-cursor');
const $redacted1 = document.getElementById('redacted-1');
const $redactedText1 = document.getElementById('redacted-text-1');
const $gameScene = document.getElementById('game-scene');
const $suspectsLineup = document.getElementById('suspects-lineup');
const $hudTimer = document.getElementById('hud-timer');
const $hudSuspects = document.getElementById('hud-suspects');
const $hudCase = document.getElementById('hud-case');
const $interrogationOverlay = document.getElementById('interrogation-overlay');
const $suspectCloseup = document.getElementById('suspect-closeup');
const $suspectNameTag = document.getElementById('suspect-name-tag');
const $backBtn = document.getElementById('back-btn');
const $dialogueText = document.getElementById('dialogue-text');
const $micBtn = document.getElementById('mic-btn');
const $accuseBtn = document.getElementById('accuse-btn');
const $screenFlash = document.getElementById('screen-flash');
const $globalMuteBtn = document.getElementById('global-mute-btn');

// AUDIO
const audioCtx = {
  landing: new Audio('./assets/audio/landing.mp3'),
  bgm: new Audio('./assets/audio/bgm.mp3'),
  clock: new Audio('./assets/audio/clock.mp3'),
  outro: new Audio('./assets/audio/outro.mp3'),
  click: new Audio('./assets/audio/click.mp3'),
  muted: false,
};
audioCtx.landing.loop = true; audioCtx.bgm.loop = true;
audioCtx.clock.loop = true; audioCtx.outro.loop = true;
audioCtx.landing.volume = 0.4; audioCtx.bgm.volume = 0.5;
audioCtx.clock.volume = 0.15; audioCtx.outro.volume = 0.3;
let landingMusicStarted = false;
if (!audioCtx.muted) audioCtx.landing.play().then(() => { landingMusicStarted = true; }).catch(() => { });
function playClick() { if (audioCtx.muted) return; audioCtx.click.currentTime = 0; audioCtx.click.play().catch(() => { }); }
document.addEventListener('click', (e) => {
  if (!landingMusicStarted && !audioCtx.muted && !$landing.classList.contains('screen-hidden')) { landingMusicStarted = true; audioCtx.landing.play().catch(() => { }); }
  if (e.target.closest('button') || e.target.closest('.btn') || e.target.closest('.neon-btn') || e.target.closest('.suspect-slot') || e.target.closest('.lang-card') || e.target.closest('.diff-card') || e.target.closest('#mode-text') || e.target.closest('#mode-voice')) playClick();
});
if ($globalMuteBtn) {
  $globalMuteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); audioCtx.muted = !audioCtx.muted;
    $globalMuteBtn.textContent = audioCtx.muted ? '🔇' : '🔊';
    if (audioCtx.muted) { audioCtx.landing.pause(); audioCtx.bgm.pause(); audioCtx.clock.pause(); audioCtx.outro.pause(); }
    else {
      const isOutro = !$verdictReveal.classList.contains('screen-hidden') || !$postgame.classList.contains('screen-hidden');
      if (isOutro) audioCtx.outro.play().catch(() => { });
      else if (!$gameIntro.classList.contains('screen-hidden') || !$gameScene.classList.contains('screen-hidden')) { audioCtx.bgm.play().catch(() => { }); audioCtx.clock.play().catch(() => { }); }
      else if (landingMusicStarted) audioCtx.landing.play().catch(() => { });
    }
  });
}

function switchScreen(hideEl, showEl) { flashTransition(); setTimeout(() => { hideEl.classList.add('screen-hidden'); showEl.classList.remove('screen-hidden'); }, 150); }
function flashTransition() { return new Promise(resolve => { $screenFlash.classList.add('flash-active'); setTimeout(() => { $screenFlash.classList.remove('flash-active'); resolve(); }, 600); }); }
function getFormattedTime() { const m = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0'); const s = String(state.elapsedSeconds % 60).padStart(2, '0'); return `${m}:${s}`; }

function handleLandingStart() { switchScreen($landing, $modeSelect); }
$landingCta.addEventListener('click', handleLandingStart);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$landing.classList.contains('screen-hidden')) handleLandingStart(); });

$modeText.addEventListener('click', () => { state.gameMode = 'text'; state.language = 'en'; $diffStep.innerHTML = 'STEP 02 <span class="step-divider">/</span> 02'; $textModeNotice.style.display = 'flex'; switchScreen($modeSelect, $diffSelect); });
$modeVoice.addEventListener('click', () => { state.gameMode = 'voice'; switchScreen($modeSelect, $langSelect); });

$langGrid.addEventListener('click', (e) => { const card = e.target.closest('.lang-card'); if (!card) return; state.language = card.dataset.lang; $langGrid.querySelectorAll('.lang-card').forEach(c => c.classList.remove('selected')); card.classList.add('selected'); setTimeout(() => { $diffStep.innerHTML = 'STEP 03 <span class="step-divider">/</span> 03'; $textModeNotice.style.display = 'none'; switchScreen($langSelect, $diffSelect); }, 300); });
$langBack.addEventListener('click', () => switchScreen($langSelect, $modeSelect));

document.querySelectorAll('.diff-card').forEach(card => { card.addEventListener('click', () => { state.difficulty = card.dataset.diff; switchScreen($diffSelect, $gameIntro); setTimeout(() => startGameIntro(), 200); }); });
$diffBack.addEventListener('click', () => { if (state.gameMode === 'text') switchScreen($diffSelect, $modeSelect); else switchScreen($diffSelect, $langSelect); });

const MOCK_INTRO = {
  caseNumber: 'CASE #2847',
  redactedLine: 'PRIORITY: ALPHA — HOMICIDE DIVISION',
  briefing: `Detective,

At 11:47 PM last night, a 911 call came in from the Grand Meridian Hotel — penthouse floor. Hotel security found the body of Marcus Whitfield, 68, billionaire art collector and philanthropist, slumped over his desk in Suite 4701.

Cause of death: blunt force trauma to the temporal lobe. The murder weapon — a bronze sculpture from his own collection — was found discarded near the balcony. No fingerprints. No forced entry.

Five individuals were present in the hotel that evening, each with means, motive, and opportunity. The hotel has been sealed. They're not going anywhere.

Your job: interrogate each suspect. Find the cracks in their stories. Separate the lies from the truth.

One of them is a killer, Detective. Find out who.`
};

function startGameIntro() {
  audioCtx.landing.pause();
  if (!audioCtx.muted) { audioCtx.bgm.play().catch(() => { }); audioCtx.clock.play().catch(() => { }); }
  $introCaseNumber.textContent = MOCK_INTRO.caseNumber;
  $introDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
  $redactedText1.textContent = MOCK_INTRO.redactedLine;
  setTimeout(() => $introStamp.classList.add('stamp-active'), 300);
  setTimeout(() => $redacted1.classList.add('revealed'), 1500);
  setTimeout(() => typewriterEffect(MOCK_INTRO.briefing), 2500);
}

function typewriterEffect(text) {
  let i = 0; $introText.textContent = ''; state.introSkipped = false;
  state.introTyping = setInterval(() => {
    if (state.introSkipped) return;
    if (i < text.length) { $introText.textContent += text[i]; i++; $introProgressBar.style.width = `${(i / text.length) * 100}%`; }
    else { clearInterval(state.introTyping); state.introTyping = null; finishIntro(); }
  }, 30);
}
function finishIntro() { if ($introCursor) $introCursor.classList.add('hidden'); $introProgressBar.style.width = '100%'; $beginBtn.classList.remove('screen-hidden'); $beginBtn.classList.add('show'); }
function skipIntro() { state.introSkipped = true; if (state.introTyping) { clearInterval(state.introTyping); state.introTyping = null; } $introText.textContent = MOCK_INTRO.briefing; $redacted1.classList.add('revealed'); $introStamp.classList.add('stamp-active'); finishIntro(); }
$skipBtn.addEventListener('click', skipIntro);
$beginBtn.addEventListener('click', () => { flashTransition(); setTimeout(() => { $gameIntro.classList.add('screen-hidden'); $gameScene.classList.remove('screen-hidden'); $hudCase.textContent = MOCK_INTRO.caseNumber; renderLineup(); startTimer(); }, 200); });

function startTimer() { state.timerInterval = setInterval(() => { state.elapsedSeconds++; const m = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0'); const s = String(state.elapsedSeconds % 60).padStart(2, '0'); $hudTimer.textContent = `⏱ ${m}:${s}`; }, 1000); }

function renderLineup() {
  state.suspects = pickSuspects(5); $suspectsLineup.innerHTML = '';
  state.suspects.forEach((suspect, index) => {
    const slot = document.createElement('div'); slot.className = 'suspect-slot'; slot.dataset.index = index;
    const basePath = `./assets/characters/${suspect.id}`;
    slot.innerHTML = `<div class="suspect-img-wrapper"><img class="suspect-img mouth-closed" src="${basePath}/mouth_closed.png" alt="${suspect.name}" draggable="false" /><img class="suspect-img mouth-open" src="${basePath}/mouth_open.png" alt="${suspect.name} talking" draggable="false" /><div class="suspect-glow"></div></div><div class="suspect-number">SUSPECT ${index + 1}</div>`;
    slot.addEventListener('click', () => openInterrogation(index));
    $suspectsLineup.appendChild(slot);
  });
}

function openInterrogation(index) {
  const suspect = state.suspects[index]; state.activeSuspect = { ...suspect, index };
  const basePath = `./assets/characters/${suspect.id}`;
  $suspectCloseup.src = `${basePath}/mouth_closed.png`; $suspectCloseup.dataset.charId = suspect.id;
  $suspectNameTag.textContent = suspect.name; $dialogueText.textContent = 'Click the mic to start interrogating...';
  $dialogueText.classList.remove('typing-cursor'); $interrogationOverlay.classList.remove('screen-hidden');
  $detectiveAvatar.classList.add('screen-hidden');
  setTimeout(() => startDemoTalk(suspect), 1500);
}
function closeInterrogation() { stopTalking(); state.activeSuspect = null; $interrogationOverlay.classList.add('screen-hidden'); $detectiveAvatar.classList.remove('screen-hidden'); }
$backBtn.addEventListener('click', closeInterrogation);

function startTalking() {
  if (state.isTalking) return; state.isTalking = true;
  const basePath = `./assets/characters/${$suspectCloseup.dataset.charId}`;
  state.talkInterval = setInterval(() => { const o = Math.random() > 0.4; $suspectCloseup.src = o ? `${basePath}/mouth_open.png` : `${basePath}/mouth_closed.png`; }, 120 + Math.random() * 80);
  document.getElementById('interrogation-suspect').classList.add('talking');
}
function stopTalking() {
  state.isTalking = false; if (state.talkInterval) { clearInterval(state.talkInterval); state.talkInterval = null; }
  if (state.activeSuspect) $suspectCloseup.src = `./assets/characters/${state.activeSuspect.id}/mouth_closed.png`;
  document.getElementById('interrogation-suspect').classList.remove('talking');
}

const DEMO_RESPONSES = [
  "I was nowhere near the penthouse that night. You can check the hotel cameras, detective.",
  "Look, I had my issues with the old man, sure. But murder? That's not my style.",
  "I was at the bar downstairs until midnight. Ask the bartender — she'll vouch for me.",
  "You're wasting your time with me. Why don't you go talk to the one who actually had a motive?",
  "I... I don't know anything. Please, I just want to go home.",
  "Money? Inheritance? Ha. I have more money than that old fool ever dreamed of.",
  "I heard shouting from the room above around 11 PM. That's all I know.",
  "Detective, everyone in this lineup had a reason to want him gone. Including people not in this room.",
];

function startDemoTalk(suspect) {
  const response = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
  startTalking(); $dialogueText.textContent = ''; $dialogueText.classList.add('typing-cursor');
  let i = 0; const t = setInterval(() => { if (i < response.length) { $dialogueText.textContent += response[i]; i++; } else { clearInterval(t); stopTalking(); $dialogueText.classList.remove('typing-cursor'); } }, 40);
}

let micActive = false;
$micBtn.addEventListener('click', () => {
  if (!state.activeSuspect) return; micActive = !micActive;
  if (micActive) { if (!audioCtx.muted) { audioCtx.bgm.volume = 0.1; audioCtx.clock.volume = 0.02; } $micBtn.classList.add('recording'); $dialogueText.textContent = '🔴 Recording... (click again to stop)'; $dialogueText.classList.add('typing-cursor'); }
  else { if (!audioCtx.muted) { audioCtx.bgm.volume = 0.5; audioCtx.clock.volume = 0.15; } $micBtn.classList.remove('recording'); $dialogueText.textContent = 'Processing your question...'; $dialogueText.classList.remove('typing-cursor'); setTimeout(() => startDemoTalk(state.activeSuspect), 1500); }
});
$accuseBtn.addEventListener('click', () => { if (!state.activeSuspect) return; closeInterrogation(); openEvidenceRecap(); });
document.getElementById('evidence-btn').addEventListener('click', () => openEvidenceRecap());

const $verdictBtn = document.getElementById('verdict-btn');
const $evidenceRecap = document.getElementById('evidence-recap');
const $recapSuspects = document.getElementById('recap-suspects');
const $recapBack = document.getElementById('recap-back');
const $recapTime = document.getElementById('recap-time');
const $proceedAccuseBtn = document.getElementById('proceed-accuse-btn');
const $accusationScreen = document.getElementById('accusation-screen');
const $accuseLineup = document.getElementById('accuse-lineup');
const $accuseBack = document.getElementById('accuse-back');
const $reasoningSection = document.getElementById('reasoning-section');
const $reasoningInput = document.getElementById('reasoning-input');
const $submitVerdictBtn = document.getElementById('submit-verdict-btn');
const $verdictReveal = document.getElementById('verdict-reveal');
const $verdictLoading = document.getElementById('verdict-loading');
const $verdictResult = document.getElementById('verdict-result');
const $verdictStamp = document.getElementById('verdict-stamp');
const $verdictTextEl = document.getElementById('verdict-text');
const $verdictSuspectReveal = document.getElementById('verdict-suspect-reveal');
const $verdictContinue = document.getElementById('verdict-continue');
const $postgame = document.getElementById('postgame');

$verdictBtn.addEventListener('click', () => openEvidenceRecap());

function openEvidenceRecap() {
  $recapTime.textContent = getFormattedTime(); $recapSuspects.innerHTML = '';
  state.suspects.forEach((suspect, i) => {
    const card = document.createElement('div'); card.className = 'recap-card';
    const bp = `./assets/characters/${suspect.id}`;
    card.innerHTML = `<div class="portrait-container"><img class="recap-card__img" src="${bp}/mouth_closed.png" alt="${suspect.name}" /></div><div class="recap-card__name">${suspect.name}</div><div class="recap-card__status">SUSPECT ${i + 1}</div>`;
    $recapSuspects.appendChild(card);
  });
  $gameScene.classList.add('screen-hidden'); $evidenceRecap.classList.remove('screen-hidden');
}
$recapBack.addEventListener('click', () => { switchScreen($evidenceRecap, $gameScene); $gameScene.classList.remove('screen-hidden'); });
$proceedAccuseBtn.addEventListener('click', () => openAccusation());

function openAccusation() {
  state.accusedSuspect = null; $reasoningSection.classList.add('screen-hidden'); $reasoningInput.value = ''; $accuseLineup.innerHTML = '';
  state.suspects.forEach((suspect, i) => {
    const card = document.createElement('div'); card.className = 'accuse-card'; card.dataset.index = i;
    const bp = `./assets/characters/${suspect.id}`;
    card.innerHTML = `<div class="portrait-container"><img class="accuse-card__img" src="${bp}/mouth_closed.png" alt="${suspect.name}" /></div><div class="accuse-card__name">${suspect.name}</div>`;
    card.addEventListener('click', () => selectAccused(i, card)); $accuseLineup.appendChild(card);
  });
  switchScreen($evidenceRecap, $accusationScreen);
}
function selectAccused(index, cardEl) {
  state.accusedSuspect = { ...state.suspects[index], index };
  $accuseLineup.querySelectorAll('.accuse-card').forEach((c, i) => { c.classList.toggle('selected', i === index); c.classList.toggle('dimmed', i !== index); });
  $reasoningSection.classList.remove('screen-hidden');
}
$accuseBack.addEventListener('click', () => switchScreen($accusationScreen, $evidenceRecap));
$submitVerdictBtn.addEventListener('click', () => { if (!state.accusedSuspect) return; state.verdict = { accused: state.accusedSuspect, reasoning: $reasoningInput.value.trim(), time: getFormattedTime() }; startVerdictReveal(); });

function startVerdictReveal() {
  audioCtx.bgm.pause(); audioCtx.clock.pause();
  if (!audioCtx.muted) { audioCtx.outro.currentTime = 0; audioCtx.outro.play().catch(() => { }); }
  $verdictLoading.style.display = 'block'; $verdictResult.classList.add('screen-hidden');
  $verdictContinue.classList.add('screen-hidden'); $verdictContinue.classList.remove('show');
  $verdictStamp.className = 'verdict-stamp'; $verdictTextEl.textContent = ''; $verdictSuspectReveal.innerHTML = '';
  const $cs = document.getElementById('credits-scroll'); $cs.classList.remove('rolling'); $cs.innerHTML = '';
  switchScreen($accusationScreen, $verdictReveal);
  if (state.guiltyIndex === null) state.guiltyIndex = Math.floor(Math.random() * state.suspects.length);
  const isCorrect = state.accusedSuspect.index === state.guiltyIndex;
  const guiltyName = state.suspects[state.guiltyIndex].name;
  const accusedName = state.accusedSuspect.name;
  setTimeout(() => {
    $verdictLoading.style.display = 'none'; $verdictResult.classList.remove('screen-hidden');
    if (isCorrect) { $verdictStamp.textContent = 'GUILTY'; $verdictStamp.classList.add('guilty'); setTimeout(() => { $verdictTextEl.textContent = `Your deduction was correct, Detective. ${guiltyName} has been found guilty of murder. Justice has been served.`; showVerdictSuspect(state.guiltyIndex, true); }, 600); }
    else { $verdictStamp.textContent = 'NOT GUILTY'; $verdictStamp.classList.add('not-guilty'); setTimeout(() => { $verdictTextEl.textContent = `You accused ${accusedName}, but the evidence points to ${guiltyName}. The real killer walks free, Detective. Better luck next time.`; showVerdictSuspect(state.guiltyIndex, false); }, 600); }
    setTimeout(() => buildAndRollCredits(isCorrect, guiltyName, accusedName), 400);
    setTimeout(() => { $verdictContinue.classList.remove('screen-hidden'); $verdictContinue.classList.add('show'); }, 2500);
  }, 3000);
}

function showVerdictSuspect(index, wasCorrect) {
  const suspect = state.suspects[index]; const bp = `./assets/characters/${suspect.id}`;
  $verdictSuspectReveal.innerHTML = `<div class="verdict-character-reveal"><div class="verdict-character-img-wrap ${wasCorrect ? 'convicted' : 'escaped'}"><img src="${bp}/mouth_closed.png" alt="${suspect.name}" class="verdict-character-img" /><div class="verdict-character-glow ${wasCorrect ? 'glow-red' : 'glow-gray'}"></div></div><div class="verdict-character-info"><div class="verdict-character-name">${suspect.name}</div><div class="verdict-character-status ${wasCorrect ? 'status-convicted' : 'status-escaped'}">${wasCorrect ? '✓ CONVICTED' : '✗ TRUE CULPRIT — ESCAPED'}</div></div></div>`;
}

function buildAndRollCredits(isCorrect, guiltyName, accusedName) {
  const $cs = document.getElementById('credits-scroll'); const $cp = document.getElementById('credits-panel');
  const data = [
    { type: 'film-title', title: 'AI DETECTIVE', subtitle: `${MOCK_INTRO.caseNumber} — ${isCorrect ? 'SOLVED' : 'UNSOLVED'}` },
    { type: 'block', role: 'Developed by', name: 'REHAAN', highlight: true }, { type: 'separator' },
    { type: 'block', role: 'Written by', name: 'DEEPSEEK R1' }, { type: 'block', role: 'Directed by', name: 'LLAMA 70B', subname: 'VERSATILE' }, { type: 'separator' },
    { type: 'block', role: 'Cast', name: 'LLAMA 8B' }, { type: 'block', role: 'Interrogated by', name: 'YOU' }, { type: 'separator' },
    { type: 'block', role: 'The Accused', name: accusedName.toUpperCase() }, { type: 'block', role: 'The Real Culprit', name: guiltyName.toUpperCase(), highlight: !isCorrect }, { type: 'separator' },
    { type: 'block', role: 'Voice Recognition', name: 'GROQ', subname: 'WHISPER' }, { type: 'block', role: 'Intelligence by', name: 'ANTHROPIC' }, { type: 'separator' },
    { type: 'block', role: 'Difficulty', name: (state.difficulty || 'MEDIUM').toUpperCase() }, { type: 'block', role: 'Time on Case', name: getFormattedTime() }, { type: 'block', role: 'Mode', name: (state.gameMode || 'TEXT').toUpperCase() }, { type: 'separator' },
    { type: 'end-card', lines: ['No suspects were harmed in the making of this game.', 'All characters, crimes, and cases are entirely fictional.', 'Any resemblance to actual criminals is purely coincidental.'], big: isCorrect ? 'JUSTICE HAS BEEN SERVED.' : 'BETTER LUCK NEXT TIME, DETECTIVE.' },
  ];
  let html = '';
  data.forEach(item => {
    if (item.type === 'film-title') html += `<div class="credit-film-title">${item.title}</div><div class="credit-film-subtitle">${item.subtitle}</div>`;
    else if (item.type === 'separator') html += '<div class="credit-separator"></div>';
    else if (item.type === 'block') html += `<div class="credit-block"><div class="credit-role">${item.role}</div><div class="credit-name${item.highlight ? ' highlight' : ''}">${item.name}</div>${item.subname ? `<div class="credit-subname">${item.subname}</div>` : ''}</div>`;
    else if (item.type === 'end-card') html += `<div class="credit-end-card">${item.lines.map(l => `<div class="credit-end-line">${l}</div>`).join('')}<div style="height:1rem;"></div><div class="credit-end-big">${item.big}</div></div>`;
  });
  html += '<div style="height:60vh;"></div>'; $cs.innerHTML = html;
  requestAnimationFrame(() => {
    void $cs.offsetHeight;
    const ph = $cp.offsetHeight; const ch = $cs.scrollHeight; const td = ch + ph;
    const dur = Math.max(50, Math.round(td / 28));
    $cs.style.setProperty('--roll-distance', `-${td}px`); $cs.style.setProperty('--roll-duration', `${dur}s`);
    setTimeout(() => $cs.classList.add('rolling'), 200);
  });
}

$verdictContinue.addEventListener('click', () => showPostGame());
function showPostGame() {
  const isCorrect = state.accusedSuspect.index === state.guiltyIndex;
  let rank = 'ROOKIE';
  if (isCorrect) { if (state.elapsedSeconds < 120 && state.difficulty === 'hard') rank = 'LEGENDARY'; else if (state.elapsedSeconds < 180) rank = 'CHIEF'; else if (state.elapsedSeconds < 300) rank = 'INSPECTOR'; else rank = 'DETECTIVE'; }
  document.getElementById('stats-rank').textContent = rank;
  document.getElementById('stat-case').textContent = MOCK_INTRO.caseNumber;
  document.getElementById('stat-diff').textContent = (state.difficulty || 'MEDIUM').toUpperCase();
  document.getElementById('stat-time').textContent = getFormattedTime();
  document.getElementById('stat-mode').textContent = (state.gameMode || 'TEXT').toUpperCase();
  document.getElementById('stat-verdict').textContent = state.accusedSuspect.name;
  document.getElementById('stat-result').textContent = isCorrect ? '✓ CORRECT' : '✗ WRONG';
  document.getElementById('stat-result').style.color = isCorrect ? '#22c55e' : 'var(--red)';
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
  switchScreen($verdictReveal, $postgame);
}

document.getElementById('play-again-btn').addEventListener('click', () => {
  audioCtx.outro.pause(); audioCtx.outro.currentTime = 0;
  if (landingMusicStarted && !audioCtx.muted) { audioCtx.landing.currentTime = 0; audioCtx.landing.play().catch(() => { }); }
  state.suspects = []; state.activeSuspect = null; state.accusedSuspect = null; state.guiltyIndex = null;
  state.elapsedSeconds = 0; state.introSkipped = false; state.gameMode = null; state.difficulty = null; state.language = 'en';
  $hudTimer.textContent = '⏱ 00:00'; $introText.textContent = ''; $introProgressBar.style.width = '0%';
  $introStamp.classList.remove('stamp-active'); $redacted1.classList.remove('revealed');
  if ($introCursor) $introCursor.classList.remove('hidden');
  $beginBtn.classList.add('screen-hidden'); $beginBtn.classList.remove('show');
  switchScreen($postgame, $landing);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.activeSuspect) closeInterrogation();
    else if (!document.getElementById('detective-overlay').classList.contains('screen-hidden')) closeDetectiveOverlay();
  }
});
console.log('🕵️ AI Detective loaded. Good luck, detective.');

// ===== DETECTIVE PARTNER OVERLAY =====
const $detectiveAvatar = document.getElementById('detective-avatar');
const $detectiveImg = document.getElementById('detective-img');
const $detectiveOverlay = document.getElementById('detective-overlay');
const $detectiveBackBtn = document.getElementById('detective-back-btn');
const $detectiveOverlayImg = document.getElementById('detective-overlay-img');
const $detectiveCharWrap = document.getElementById('detective-char-wrap');
const $detectiveHintText = document.getElementById('detective-hint-text');
const $detectiveAskBtn = document.getElementById('detective-ask-btn');
const $partnerSuspects = document.getElementById('partner-suspects');
const $partnerTime = document.getElementById('partner-time');
const $partnerDiff = document.getElementById('partner-diff');
const $partnerMode = document.getElementById('partner-mode');
let detectiveTalkInterval = null;
let partnerTimeInterval = null;

const PARTNER_HINTS = [
  "I've been watching them carefully. One keeps avoiding eye contact whenever the victim's name comes up.",
  "Check the timeline again — someone's alibi doesn't add up. The math isn't right.",
  "One suspect is way too calm for this situation. Guilt? Or just good nerves?",
  "Body language tells a story. Watch how they hold themselves when you press on motive.",
  "Someone here knew the hotel layout. That narrows it down more than you'd think.",
  "Liars get the big stuff right but slip on the little things. Dig into the details.",
  "The most cooperative suspect isn't always the innocent one. I've seen it before.",
  "Follow the money, Detective. Always follow the money.",
  "Someone in that lineup had access to the penthouse. That's your starting point.",
  "Trust your gut. You've been doing this long enough to know when something's off.",
];

function setDetectiveOverlaySpeaking(on) {
  if (!$detectiveCharWrap || !$detectiveOverlayImg) return;
  if (on) {
    $detectiveCharWrap.classList.add('talking');
    if (!detectiveTalkInterval) detectiveTalkInterval = setInterval(() => { $detectiveOverlayImg.src = Math.random() > 0.4 ? './assets/characters/detective/mouth_open.png' : './assets/characters/detective/mouth_closed.png'; }, 130);
  } else {
    $detectiveCharWrap.classList.remove('talking');
    if (detectiveTalkInterval) { clearInterval(detectiveTalkInterval); detectiveTalkInterval = null; }
    $detectiveOverlayImg.src = './assets/characters/detective/mouth_closed.png';
  }
}

window.setDetectiveSpeaking = function (on) {
  setDetectiveOverlaySpeaking(on);
  if (!$detectiveImg) return;
  if (on) { if (!detectiveTalkInterval) detectiveTalkInterval = setInterval(() => { $detectiveImg.src = Math.random() > 0.4 ? './assets/characters/detective/mouth_open.png' : './assets/characters/detective/mouth_closed.png'; }, 150); }
  else { if (detectiveTalkInterval) { clearInterval(detectiveTalkInterval); detectiveTalkInterval = null; } $detectiveImg.src = './assets/characters/detective/mouth_closed.png'; }
};

function typeHint(text) {
  $detectiveHintText.textContent = ''; $detectiveHintText.classList.add('typing'); setDetectiveOverlaySpeaking(true);
  let i = 0; const t = setInterval(() => { if (i < text.length) { $detectiveHintText.textContent += text[i]; i++; } else { clearInterval(t); $detectiveHintText.classList.remove('typing'); setDetectiveOverlaySpeaking(false); } }, 28);
}

function openDetectiveOverlay() {
  $partnerSuspects.textContent = state.suspects.length || '—';
  $partnerDiff.textContent = (state.difficulty || '—').toUpperCase();
  $partnerMode.textContent = (state.gameMode || '—').toUpperCase();
  $partnerTime.textContent = getFormattedTime();
  partnerTimeInterval = setInterval(() => { $partnerTime.textContent = getFormattedTime(); }, 1000);
  $detectiveHintText.textContent = 'Your partner is observing the lineup...';
  $detectiveHintText.classList.remove('typing');
  setDetectiveOverlaySpeaking(false);
  $detectiveOverlayImg.src = './assets/characters/detective/mouth_closed.png';
  $detectiveOverlay.classList.remove('screen-hidden');
  setTimeout(() => { typeHint(PARTNER_HINTS[Math.floor(Math.random() * PARTNER_HINTS.length)]); }, 800);
}

function closeDetectiveOverlay() {
  setDetectiveOverlaySpeaking(false);
  if (partnerTimeInterval) { clearInterval(partnerTimeInterval); partnerTimeInterval = null; }
  $detectiveOverlay.classList.add('screen-hidden');
}

$detectiveAvatar.addEventListener('click', () => { if (!$detectiveOverlay.classList.contains('screen-hidden')) return; openDetectiveOverlay(); });
$detectiveBackBtn.addEventListener('click', closeDetectiveOverlay);
$detectiveAskBtn.addEventListener('click', () => { if ($detectiveCharWrap.classList.contains('talking')) return; typeHint(PARTNER_HINTS[Math.floor(Math.random() * PARTNER_HINTS.length)]); });