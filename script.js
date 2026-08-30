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
const navbar = document.getElementById('navbar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const toastContainer = document.getElementById('toast-container');

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

      // Show success
      form.style.display = 'none';
      formSuccess.classList.add('visible');
      return;
    }

    // Insert into Supabase
    const { data, error } = await supabaseClient
      .from('waitlist_signups')
      .insert([
        {
          nickname: nickname,
          email: email,
          phone: phone || null,
        }
      ]);

    if (error) {
      // Handle duplicate email
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        showToast('This email is already on the waitlist! 🎉', 'info');
        return;
      }
      throw error;
    }

    // Success
    form.style.display = 'none';
    formSuccess.classList.add('visible');
    showToast('Welcome to the Nexus Terminal waitlist! 🚀');

    // Refresh count
    fetchWaitlistCount();

  } catch (err) {
    console.error('Waitlist submission error:', err);
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

// ============================================
// WAITLIST COUNT (Optional — reads from DB)
// ============================================
async function fetchWaitlistCount() {
  try {
    if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') return;

    const { count, error } = await supabaseClient
      .from('waitlist_signups')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null && count > 0) {
      waitlistCount.textContent = count.toLocaleString();
      waitlistCounter.style.display = 'block';
    }
  } catch (err) {
    // Silently fail — counter is optional
    console.warn('Could not fetch waitlist count:', err);
  }
}

// Fetch count on load
fetchWaitlistCount();

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
