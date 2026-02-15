// ===== AI Detective — Main Game Logic =====

// Character pool — 8 characters, backend picks 5 per case
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

// For the mock, pick 5 random suspects
function pickSuspects(count = 5) {
  const shuffled = [...CHARACTER_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ===== STATE =====
const state = {
  suspects: [],
  activeSuspect: null,
  isTalking: false,
  talkInterval: null,
  timerInterval: null,
  elapsedSeconds: 0,
};

// ===== DOM ELEMENTS =====
const $caseIntro = document.getElementById('case-intro');
const $startBtn = document.getElementById('start-btn');
const $gameScene = document.getElementById('game-scene');
const $suspectsLineup = document.getElementById('suspects-lineup');
const $interrogationOverlay = document.getElementById('interrogation-overlay');
const $suspectCloseup = document.getElementById('suspect-closeup');
const $suspectNameTag = document.getElementById('suspect-name-tag');
const $backBtn = document.getElementById('back-btn');
const $dialogueText = document.getElementById('dialogue-text');
const $micBtn = document.getElementById('mic-btn');
const $accuseBtn = document.getElementById('accuse-btn');
const $hudTimer = document.getElementById('hud-timer');
const $hudSuspects = document.getElementById('hud-suspects');

// ===== CASE INTRO =====
$startBtn.addEventListener('click', () => {
  $caseIntro.classList.add('hidden');
  $gameScene.classList.remove('hidden');
  renderLineup();
  startTimer();
});

// ===== TIMER =====
function startTimer() {
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds++;
    const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(state.elapsedSeconds % 60).padStart(2, '0');
    $hudTimer.textContent = `⏱ ${mins}:${secs}`;
  }, 1000);
}

// ===== RENDER LINEUP =====
function renderLineup() {
  state.suspects = pickSuspects(5);
  $suspectsLineup.innerHTML = '';

  state.suspects.forEach((suspect, index) => {
    const slot = document.createElement('div');
    slot.className = 'suspect-slot';
    slot.dataset.index = index;
    slot.innerHTML = `
      <div class="suspect-img-wrapper">
        <img 
          class="suspect-img mouth-closed" 
          src="/assets/characters/${suspect.id}/mouth_closed.png" 
          alt="${suspect.name}"
          draggable="false"
        />
        <img 
          class="suspect-img mouth-open" 
          src="/assets/characters/${suspect.id}/mouth_open.png" 
          alt="${suspect.name} talking"
          draggable="false"
        />
        <div class="suspect-glow"></div>
      </div>
      <div class="suspect-number">SUSPECT ${index + 1}</div>
    `;

    slot.addEventListener('click', () => openInterrogation(index));
    $suspectsLineup.appendChild(slot);
  });
}

// ===== INTERROGATION =====
function openInterrogation(index) {
  const suspect = state.suspects[index];
  state.activeSuspect = { ...suspect, index };

  // Set closeup image
  $suspectCloseup.src = `/assets/characters/${suspect.id}/mouth_closed.png`;
  $suspectCloseup.dataset.charId = suspect.id;
  $suspectNameTag.textContent = suspect.name;

  // Reset dialogue
  $dialogueText.textContent = 'Click the mic to start interrogating...';
  $dialogueText.classList.remove('typing-cursor');

  // Show overlay
  $interrogationOverlay.classList.remove('hidden');

  // Demo: auto-talk after a short delay
  setTimeout(() => {
    startDemoTalk(suspect);
  }, 1500);
}

function closeInterrogation() {
  stopTalking();
  state.activeSuspect = null;
  $interrogationOverlay.classList.add('hidden');
}

$backBtn.addEventListener('click', closeInterrogation);

// ===== MOUTH FLAP ANIMATION =====
function startTalking() {
  if (state.isTalking) return;
  state.isTalking = true;

  const charId = $suspectCloseup.dataset.charId;
  const mouthClosed = `/assets/characters/${charId}/mouth_closed.png`;
  const mouthOpen = `/assets/characters/${charId}/mouth_open.png`;

  // Random mouth flapping
  state.talkInterval = setInterval(() => {
    const isOpen = Math.random() > 0.4; // slightly more open than closed for a natural feel
    $suspectCloseup.src = isOpen ? mouthOpen : mouthClosed;
  }, 120 + Math.random() * 80); // randomize interval for natural feel

  document.getElementById('interrogation-suspect').classList.add('talking');
}

function stopTalking() {
  state.isTalking = false;
  if (state.talkInterval) {
    clearInterval(state.talkInterval);
    state.talkInterval = null;
  }

  // Reset to mouth closed
  if (state.activeSuspect) {
    $suspectCloseup.src = `/assets/characters/${state.activeSuspect.id}/mouth_closed.png`;
  }
  document.getElementById('interrogation-suspect').classList.remove('talking');
}

// ===== DEMO TALK (Mock — no backend) =====
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

  // Start mouth animation
  startTalking();

  // Typewriter effect for dialogue
  $dialogueText.textContent = '';
  $dialogueText.classList.add('typing-cursor');

  let charIndex = 0;
  const typeInterval = setInterval(() => {
    if (charIndex < response.length) {
      $dialogueText.textContent += response[charIndex];
      charIndex++;
    } else {
      clearInterval(typeInterval);
      stopTalking();
      $dialogueText.classList.remove('typing-cursor');
    }
  }, 40);
}

// ===== MIC BUTTON (Mock) =====
let micActive = false;
$micBtn.addEventListener('click', () => {
  if (!state.activeSuspect) return;

  micActive = !micActive;
  if (micActive) {
    $micBtn.classList.add('recording');
    $dialogueText.textContent = '🔴 Recording... (click again to stop)';
    $dialogueText.classList.add('typing-cursor');
  } else {
    $micBtn.classList.remove('recording');
    $dialogueText.textContent = 'Processing your question...';
    $dialogueText.classList.remove('typing-cursor');

    // Simulate suspect responding after a delay
    setTimeout(() => {
      startDemoTalk(state.activeSuspect);
    }, 1500);
  }
});

// ===== ACCUSE BUTTON (Mock) =====
$accuseBtn.addEventListener('click', () => {
  if (!state.activeSuspect) return;

  const suspectName = state.activeSuspect.name;
  const confirmed = confirm(`Are you sure you want to accuse ${suspectName}?`);

  if (confirmed) {
    stopTalking();
    $dialogueText.innerHTML = `<strong style="color: var(--noir-highlight);">⚖️ You have accused ${suspectName}!</strong><br><br>The case will now go to trial...`;
  }
});

// ===== EVIDENCE BUTTON (Mock) =====
document.getElementById('evidence-btn').addEventListener('click', () => {
  alert('📋 Evidence Board coming soon!\n\nThis will show collected clues, alibis, and contradictions.');
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.activeSuspect) {
    closeInterrogation();
  }
});

console.log('🕵️ AI Detective loaded. Good luck, detective.');
