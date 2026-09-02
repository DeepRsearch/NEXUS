/* ============================================
  NEXUS TERMINAL — SCRIPT
  Waitlist form + Supabase + UI interactions
   ============================================ */

// ============================================
// SUPABASE CONFIG
// ============================================
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
const waitlistCount = document.getElementById('waitlist-count');
const spotsLeftHero = document.getElementById('spots-left-hero');
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
  if (!input) return;
  input.addEventListener('input', () => {
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) clearFieldError(input, errorEl);
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
    // Generate a strong password meeting all Supabase complexity rules
    const securePassword = 'Nexus2026!' + crypto.randomUUID().replace(/-/g, '') + 'A#';

    // Insert into Supabase Auth (Database Trigger automatically syncs to 'profiles' table)
    const { data, error } = await supabaseClient.auth.users({
      email: email,
      password: securePassword,
      options: {
        data: {
          nickname: nickname,
          phone_number: phone || null
        }
      }
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already registered') || error.status === 422) {
        showToast('This email is already on the waitlist! 🎉', 'info', 6000);
        return;
      }
      if (error.message?.toLowerCase().includes('rate limit') || error.status === 429) {
        showToast('Email rate limit reached. Please wait a few minutes and try again! ⏳', 'error', 8000);
        return;
      }
      throw error;
    }

    // Supabase returns empty identities array if email already exists
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      showToast('This email is already on the waitlist! Check your spam folder for your link. 🎉', 'info', 7000);
      return;
    }

    // Refresh database count after successful trigger execution
    const totalCount = await fetchWaitlistCount();
    const userSpot = totalCount > 0 ? totalCount : currentWaitlistCount + 1;
    
    if (userSpotNumber) userSpotNumber.textContent = `#${userSpot}`;
    updateCounters(userSpot);

    // Pulse animation on the spots badge
    if (spotsLeftHero) {
      spotsLeftHero.style.transition = 'color 0.4s ease, transform 0.4s ease';
      spotsLeftHero.style.color = '#00ffcc';
      spotsLeftHero.style.transform = 'scale(1.2)';
      setTimeout(() => {
        spotsLeftHero.style.color = '';
        spotsLeftHero.style.transform = 'scale(1)';
      }, 2000);
    }

    // Show success state
    form.style.display = 'none';
    formSuccess.classList.add('visible');
    showToast('You\'re on the list! Check your inbox (or Spam folder) for a confirmation email! 🚀', 'info', 7000);

  } catch (err) {
    console.error('Waitlist submission error:', err);
    let errorMsg = err?.message || err?.error_description;
    if (!errorMsg && typeof err === 'object') {
      try { errorMsg = JSON.stringify(err); } catch (e) { errorMsg = String(err); }
    }
    showToast(errorMsg || 'Could not complete signup. Please check console for details.', 'error', 8000);
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
  if (waitlistCount) waitlistCount.textContent = count.toLocaleString();
}

// Fetch user count directly from public profiles table
async function fetchWaitlistCount() {
  try {
    const { count, error } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;

    updateCounters(count || 0);
    return count || 0;
  } catch (err) {
    console.warn('Could not fetch waitlist count from Supabase:', err);
    return 0;
  }
}

// Fetch count on initial page load
fetchWaitlistCount();

// ============================================
// EMAIL VERIFICATION REDIRECT CHECK
// ============================================
async function checkVerificationRedirect() {
  const urlParams = new URLSearchParams(window.location.search);

  const isVerifiedReturn = window.location.hash.includes('access_token=') ||
                          window.location.hash.includes('type=signup') ||
                          urlParams.get('type') === 'signup' ||
                          urlParams.get('code') !== null;

  if (isVerifiedReturn) {
    showToast('Email verified! Your spot is officially locked in! 🚀', 'info', 8000);

    // Clean up the URL tokens from the address bar
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkVerificationRedirect();
});

// ============================================
// SMOOTH SCROLL FOR CTA
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
