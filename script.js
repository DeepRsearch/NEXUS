/* ============================================
   NEXUS TERMINAL — SCRIPT
   Waitlist form + Supabase + UI interactions
   ============================================ */

// ============================================
// SUPABASE CONFIG
// ============================================
// ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES FROM:
//    Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://uweekccaumkjukwsdbzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZWVrY2NhdW1ranVrd3NkYnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODE0NzMsImV4cCI6MjEwMzM1NzQ3M30.ApqOhNGJffgI5XO2rYmAAESYWZEFdhQFcU6EUE6ZMhc';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DOM ELEMENTS
// ============================================
const form = document.getElementById('waitlist-form');
const submitBtn = document.getElementById('submit-btn');
const formSuccess = document.getElementById('form-success');
const nicknameInput = document.getElementById('nickname');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const waitlistCounter = document.getElementById('waitlist-counter');
const waitlistCount = document.getElementById('waitlist-count');
const spotsLeftHero = document.getElementById('spots-left-hero');
const spotsLeftVal = document.getElementById('spots-left-val');
const spotsProgressFill = document.getElementById('spots-progress-fill');
const userSpotNumber = document.getElementById('user-spot-number');
const navbar = document.getElementById('navbar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const toastContainer = document.getElementById('toast-container');

const TOTAL_CAPACITY = 500;
let currentWaitlistCount = 0;

// ============================================
// STARFIELD ANIMATION
// ============================================
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 180;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.4 + 0.2,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        drift: (Math.random() - 0.5) * 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      const alpha = star.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 190, 255, ${alpha})`;
      ctx.fill();

      // Subtle movement
      star.y -= star.speed;
      star.x += star.drift;

      // Wrap around
      if (star.y < -2) {
        star.y = canvas.height + 2;
        star.x = Math.random() * canvas.width;
      }
      if (star.x < -2) star.x = canvas.width + 2;
      if (star.x > canvas.width + 2) star.x = -2;
    }
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  requestAnimationFrame(draw);

  window.addEventListener('resize', () => {
    resize();
    createStars();
  });
})();

// ============================================
// NAVBAR SCROLL
// ============================================
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = scrollY;
}, { passive: true });

// ============================================
// MOBILE MENU
// ============================================
mobileMenuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const isOpen = navLinks.classList.contains('open');
  mobileMenuBtn.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ============================================
// SCROLL REVEAL
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info', duration = 4500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ============================================
// FORM VALIDATION
// ============================================
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  if (!phone.trim()) return true; // optional
  return /^[\d\s\-\+\(\)]{7,20}$/.test(phone.trim());
}

function showFieldError(inputEl, errorEl) {
  inputEl.classList.add('error');
  errorEl.classList.add('visible');
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('error');
  errorEl.classList.remove('visible');
}

// Clear errors on input
[nicknameInput, emailInput, phoneInput].forEach(input => {
  input.addEventListener('input', () => {
    const errorEl = document.getElementById(`${input.id}-error`);
    clearFieldError(input, errorEl);
  });
});

// ============================================
// FORM SUBMISSION
// ============================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate
  let isValid = true;

  const nickname = nicknameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!nickname) {
    showFieldError(nicknameInput, document.getElementById('nickname-error'));
    isValid = false;
  }

  if (!email || !validateEmail(email)) {
    showFieldError(emailInput, document.getElementById('email-error'));
    isValid = false;
  }

  if (!validatePhone(phone)) {
    showFieldError(phoneInput, document.getElementById('phone-error'));
    isValid = false;
  }

  if (!isValid) return;

  // Set loading state
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    // Check if Supabase is configured
    if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
      // Demo mode — show success without hitting Supabase
      console.warn('⚠️ Supabase anon key not configured. Running in demo mode.');
      showToast('Demo mode — connect Supabase to save signups.', 'info');

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Demo mode — show success
      const spotPos = currentWaitlistCount + 1;
      if (userSpotNumber) userSpotNumber.textContent = `#${spotPos}`;
      updateCounters(spotPos);

      form.style.display = 'none';
      formSuccess.classList.add('visible');
      return;
    }

    // Insert into Supabase
    const { data, error } = await supabaseClient.auth.signUp({
       email: eamil,
       //since its just a waitlist, we make a random36 string in background
       password: crypto.randomUUID() + Math.random().toString(36),
       options: {
          data: {
             nickname : nickname,
             phone_number: phone || null
          }
       }
    });

     if (error) {
        //Catch instance where user email is already registered
        if (error.message.includes('already registered') || error.status === 422) {
           showToast('Tjis email is already on the waitlist! 🎉', 'info');
           return;
        }
        throw error;
     }
     

    // Calculate spot position
    const userSpot = currentWaitlistCount + 1;
    if (userSpotNumber) userSpotNumber.textContent = `#${userSpot}`;

    // Success
    form.style.display = 'none';
    formSuccess.classList.add('visible');
    showToast('Check your email to Verify and Claim your spot on the Nexus Terminal waitlist! 🚀', 'Success!');

    // Refresh live count & progress bar
    await fetchWaitlistCount();

  } catch (err) {
    console.error('Waitlist submission error:', err);
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

// ============================================
// WAITLIST COUNT & SPOTS REMAINING
// ============================================
function updateCounters(count) {
  currentWaitlistCount = count;
  const spotsLeft = Math.max(0, TOTAL_CAPACITY - count);
  
  if (spotsLeftHero) spotsLeftHero.textContent = spotsLeft.toLocaleString();
  if (spotsLeftVal) spotsLeftVal.textContent = spotsLeft.toLocaleString();
  if (waitlistCount) waitlistCount.textContent = count.toLocaleString();
  
  const percentage = count > 0 ? Math.min(100, Math.max(2, (count / TOTAL_CAPACITY) * 100)) : 0;
  if (spotsProgressFill) spotsProgressFill.style.width = `${percentage}%`;
}

async function fetchWaitlistCount() {
  try {
    if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') return 0;
      // changes target from waitlist to profiles
    const { count, error } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      updateCounters(count);
      return count;
    }
  } catch (err) {
    console.warn('Could not fetch waitlist count:', err);
  }
  return 0;
}

// Fetch count on load
fetchWaitlistCount();


//============================================
// EMAIL VERIFICATION REDIRECT CHECK
//============================================
function checkVerificationRedirect() {
   const urlParams = new URLSearchParams(window.location.search);

   // When supabase Processes an email link, it can return an access_token,
   // or a system code via type=signup hashes/query strings.
   const inVerifiedReturn = window.location.hash.includes('access_token=') || urlParams.get('type') === 'signup';

   if (isVerifieReturn) {
      // 1. give the user visual confirmation
      showToast('Email verified successfully! you are officially locked into the Nexus Terminal list! 🚀', 'success', 8000);
      //2. Playfull uX option: trigger client side animation
      if (spotsLeftHero) {
         spotsLeftHero.style.color = '#00ffcc'; //temporary color pulse
      }
      //3. clean up the address bar so the ugly tokens vanish from view
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', clearUrl);
   }
}

//check for redirect tokens when the com contents fully paints
document.addEventListener('DOMContentLoaded', () => {
   checkVericationRedirect();
});


// ============================================
// SMOOTH SCROLL for CTA
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
