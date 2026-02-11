const pageEnvelope = document.getElementById("pageEnvelope");
const pageQuestion  = document.getElementById("pageQuestion");
const openEnvelope  = document.getElementById("openEnvelope");

const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");

const yesOverlay = document.getElementById("yesOverlay");
const noOverlay  = document.getElementById("noOverlay");
const closeYes   = document.getElementById("closeYes");
const closeNo    = document.getElementById("closeNo");

const siuuuAudio = document.getElementById("siuuuAudio");

let yesScale = 1;
let noEscapes = 0;

let heartTimer = null;
let slideshowTimer = null;

// --- Page switch ---
openEnvelope.addEventListener("click", () => {
  pageEnvelope.classList.add("hidden");
  pageQuestion.classList.remove("hidden");
  resetNoButtonPosition();
});

// --- Runaway "No" behavior (IMPROVED) ---
function resetNoButtonPosition(){
  noBtn.style.left = "58%";
  noBtn.style.top = "10px";
  noBtn.style.transform = "translate(-50%, 0)";
}

function clamp(n, min, max){ 
  return Math.max(min, Math.min(max, n)); 
}

function moveNoButtonAwayFrom(pointerX, pointerY){
  const card = document.querySelector(".card");
  const rect = card.getBoundingClientRect();

  const bRect = noBtn.getBoundingClientRect();
  const bw = bRect.width;
  const bh = bRect.height;

  const currentLeft = parseFloat(noBtn.style.left || "58");
  const currentTop  = parseFloat(noBtn.style.top  || "10");

  const px = pointerX - rect.left;
  const py = pointerY - rect.top;

  const centerX = (currentLeft / 100) * rect.width;
  const centerY = currentTop + bh/2;

  let dx = centerX - px;
  let dy = centerY - py;

  const mag = Math.sqrt(dx*dx + dy*dy) || 1;
  dx /= mag; 
  dy /= mag;

  // Increase distance each time (faster escape)
  const distance = 140 + (noEscapes * 25);

  let newX = centerX + dx * distance;
  let newY = centerY + dy * distance;

  // Keep button inside card boundaries
  newX = clamp(newX, bw/2 + 20, rect.width - bw/2 - 20);
  newY = clamp(newY, bh/2 + 20, rect.height - bh/2 - 20);

  const leftPct = (newX / rect.width) * 100;
  const topPx = newY - bh/2;

  noBtn.style.left = `${leftPct}%`;
  noBtn.style.top  = `${topPx}px`;

  noEscapes += 1;
  
  // Make YES button bigger each time
  yesScale = Math.min(2.5, yesScale + 0.15);
  yesBtn.style.transform = `scale(${yesScale})`;
}

function handleNoProximity(e){
  const card = document.querySelector(".card");
  if (!card) return;
  
  const rect = card.getBoundingClientRect();

  const x = e.clientX;
  const y = e.clientY;

  // ignore if not on question page
  if (pageQuestion.classList.contains("hidden")) return;

  // ignore if not inside card area (with some margin)
  const margin = 50;
  if (x < rect.left - margin || x > rect.right + margin || 
      y < rect.top - margin || y > rect.bottom + margin) return;

  const b = noBtn.getBoundingClientRect();
  const cx = b.left + b.width/2;
  const cy = b.top + b.height/2;

  const dist = Math.hypot(x - cx, y - cy);

  // Increased detection radius for better escape behavior
  if (dist < 140){
    moveNoButtonAwayFrom(x, y);
  }
}

// Mouse movement tracking
document.addEventListener("mousemove", handleNoProximity);

// Touch movement tracking
document.addEventListener("touchmove", (e) => {
  if (!e.touches || !e.touches[0]) return;
  const t = e.touches[0];
  handleNoProximity({ clientX: t.clientX, clientY: t.clientY });
}, { passive: true });

// If she actually manages to click NO:
noBtn.addEventListener("click", () => {
  noOverlay.classList.remove("hidden");
});

// YES celebration + slideshow
yesBtn.addEventListener("click", async () => {
  yesOverlay.classList.remove("hidden");

  // Try to play audio (with user interaction it should work)
  try {
    siuuuAudio.currentTime = 0;
    await siuuuAudio.play();
  } catch(err) {
    console.log("Audio autoplay blocked:", err);
    // Audio might be blocked, that's okay
  }

  startSlideshow();
});

// Close YES
closeYes.addEventListener("click", () => {
  yesOverlay.classList.add("hidden");
  stopHearts();
  stopSlideshow();
  
  // Pause audio
  if (siuuuAudio) {
    siuuuAudio.pause();
    siuuuAudio.currentTime = 0;
  }
});

// Close NO (reset)
closeNo.addEventListener("click", () => {
  noOverlay.classList.add("hidden");
  yesScale = 1;
  yesBtn.style.transform = `scale(${yesScale})`;
  noEscapes = 0;
  resetNoButtonPosition();
});

/* ------------------------------
   Floating hearts
--------------------------------*/
function startHearts(){
  const layer = document.getElementById("heartLayer");
  if(!layer) return;

  stopHearts();

  heartTimer = setInterval(() => {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = Math.random() < 0.5 ? "💗" : "💖";

    const left = Math.random() * 100;
    heart.style.left = left + "%";

    const drift = (Math.random() * 120 - 60).toFixed(0) + "px";
    const scale = (0.7 + Math.random() * 1.1).toFixed(2);
    const duration = (3.2 + Math.random() * 2.8).toFixed(2) + "s";

    heart.style.setProperty("--drift", drift);
    heart.style.setProperty("--scale", scale);
    heart.style.animationDuration = duration;

    layer.appendChild(heart);
    setTimeout(() => heart.remove(), 7000);
  }, 220);
}

function stopHearts(){
  if(heartTimer){
    clearInterval(heartTimer);
    heartTimer = null;
  }
  // Clear existing hearts
  const layer = document.getElementById("heartLayer");
  if(layer) {
    layer.innerHTML = '';
  }
}

/* ------------------------------
   Slideshow (FIXED - only shows images that loaded)
--------------------------------*/
function startSlideshow(){
  stopSlideshow();

  const allSlides = Array.from(document.querySelectorAll(".slide"));
  const finalText = document.getElementById("finalText");

  // Filter out slides that failed to load (display:none from onerror)
  const slides = allSlides.filter(slide => {
    const style = window.getComputedStyle(slide);
    return style.display !== 'none';
  });

  // If no slides loaded, just show the final text
  if (slides.length === 0) {
    setTimeout(() => {
      finalText.classList.add("show");
      setTimeout(() => finalText.classList.add("pulse"), 900);
    }, 800);
    startHearts();
    setTimeout(() => stopHearts(), 9000);
    return;
  }

  // Reset all slides
  slides.forEach((s, i) => {
    s.classList.remove("active");
    if (i === 0) s.classList.add("active");
  });
  
  finalText.classList.remove("show", "pulse");

  startHearts();

  let current = 0;
  const total = slides.length;
  const slideDuration = 3500; // 3.5 seconds per slide

  slideshowTimer = setInterval(() => {
    slides[current].classList.remove("active");
    current++;

    if(current < total){
      slides[current].classList.add("active");
    } else {
      // Slideshow finished
      stopSlideshow();

      // Show final message
      setTimeout(() => {
        finalText.classList.add("show");
        setTimeout(() => finalText.classList.add("pulse"), 900);
      }, 800);

      // Stop hearts after a while
      setTimeout(() => stopHearts(), 9000);
    }
  }, slideDuration);
}

function stopSlideshow(){
  if(slideshowTimer){
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
}

// Enable audio on first user interaction (for mobile browsers)
document.addEventListener('click', function enableAudio() {
  siuuuAudio.load();
  document.removeEventListener('click', enableAudio);
}, { once: true });