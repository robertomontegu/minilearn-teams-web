// ============================================================
// CONFIG — actualiza estos valores antes de hacer deploy
// ============================================================
const ML = {
  apiBase:        'https://api.minilearn.app',  // URL de tu Rails API
  appUrl:         'https://app.minilearn.app',  // URL del admin (sin barra al final)
  googleClientId: '173741568676-g6bj6reb5et282ueebko1dvd6shbdrfd.apps.googleusercontent.com',
};

// ============================================================
// PLANES
// ============================================================
const PLANS = {
  free:     { label: 'Free',     cta: 'Crear workspace gratis',       note: 'Sin tarjeta de crédito.' },
  basic:    { label: 'Basic',    cta: 'Comenzar plan Basic',          note: '14 días gratis, luego USD 3 / usuario / mes.' },
  business: { label: 'Business', cta: 'Comenzar plan Business',       note: '14 días gratis, luego USD 8 / usuario / mes.' },
};

// ============================================================
// ANIMATIONS (reveal on scroll)
// ============================================================
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
);
reveals.forEach((el) => revealObserver.observe(el));

// ============================================================
// YEAR
// ============================================================
const yearNode = document.querySelector('#year');
if (yearNode) yearNode.textContent = new Date().getFullYear();

// ============================================================
// MODAL STATE
// ============================================================
let activePlan       = 'free';
let googleCredential = null;  // ID token from Google when OAuth is chosen

// ============================================================
// OPEN / CLOSE MODAL
// ============================================================
function openRegister(plan) {
  plan = plan || 'free';
  activePlan       = plan;
  googleCredential = null;

  const modal      = document.getElementById('ml-modal');
  if (!modal) return;

  const planConfig = PLANS[plan] || PLANS.free;

  modal.querySelector('.ml-modal__plan').textContent   = planConfig.label;
  modal.querySelector('#ml-submit').textContent         = planConfig.cta;
  modal.querySelector('.ml-modal__note').textContent    = planConfig.note;
  modal.querySelector('#ml-form').reset();

  // Reset Google state
  _resetGoogleState(modal);

  // Clear errors
  const errEl = modal.querySelector('#ml-error');
  if (errEl) { errEl.textContent = ''; errEl.hidden = true; }

  modal.showModal();
  modal.querySelector('[name="name"]').focus();
}

function closeRegister() {
  document.getElementById('ml-modal')?.close();
}

// ============================================================
// GOOGLE OAUTH — init button
// ============================================================
function _initGoogle() {
  if (!window.google?.accounts?.id) return;
  if (ML.googleClientId === 'REEMPLAZA_CON_TU_GOOGLE_CLIENT_ID') return;

  google.accounts.id.initialize({
    client_id:            ML.googleClientId,
    callback:             _onGoogleCredential,
    auto_select:          false,
    cancel_on_tap_outside: true,
  });

  const container = document.getElementById('ml-google-btn');
  if (!container) return;

  google.accounts.id.renderButton(container, {
    type:            'standard',
    theme:           'outline',
    size:            'large',
    text:            'continue_with',
    logo_alignment:  'left',
    width:           340,
  });
}

// ============================================================
// GOOGLE OAUTH — credential callback
// ============================================================
function _onGoogleCredential(response) {
  googleCredential = response.credential;

  // Decode JWT payload (no signature verification — server does that)
  try {
    const b64 = response.credential.split('.')[1]
      .replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? b64 + '='.repeat(4 - (b64.length % 4)) : b64;
    const payload = JSON.parse(
      decodeURIComponent(
        atob(pad).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      )
    );
    const form = document.querySelector('#ml-form');
    if (form) {
      const nameField  = form.querySelector('[name="name"]');
      const emailField = form.querySelector('[name="email"]');
      if (nameField  && payload.name)  nameField.value  = payload.name;
      if (emailField && payload.email) emailField.value = payload.email;
    }
  } catch (_) {}

  // Hide password field — not needed for Google users
  const modal     = document.getElementById('ml-modal');
  const passWrap  = modal.querySelector('.ml-field--password');
  const passInput = modal.querySelector('[name="password"]');
  if (passWrap)  passWrap.style.display = 'none';
  if (passInput) passInput.required     = false;

  // Show Google badge
  const badge = modal.querySelector('.ml-google-badge');
  if (badge) badge.hidden = false;

  // Hide Google button container
  const btn = modal.querySelector('.ml-google-section');
  if (btn) btn.style.display = 'none';

  // Update CTA
  modal.querySelector('#ml-submit').textContent = 'Crear workspace con Google →';

  // Focus workspace field
  modal.querySelector('[name="workspace_name"]')?.focus();
}

function _resetGoogleState(modal) {
  googleCredential = null;

  const passWrap  = modal.querySelector('.ml-field--password');
  const passInput = modal.querySelector('[name="password"]');
  if (passWrap)  passWrap.style.display = '';
  if (passInput) passInput.required     = true;

  const badge = modal.querySelector('.ml-google-badge');
  if (badge) badge.hidden = true;

  const googleSection = modal.querySelector('.ml-google-section');
  if (googleSection) googleSection.style.display = '';
}

function resetGoogleSelection() {
  const modal = document.getElementById('ml-modal');
  if (!modal) return;
  _resetGoogleState(modal);
  const planConfig = PLANS[activePlan] || PLANS.free;
  modal.querySelector('#ml-submit').textContent = planConfig.cta;
}

// ============================================================
// ERRORS + LOADING
// ============================================================
function _showError(msg) {
  const el = document.querySelector('#ml-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden      = false;
}

function _clearError() {
  const el = document.querySelector('#ml-error');
  if (el) { el.textContent = ''; el.hidden = true; }
}

function _setLoading(on) {
  const btn = document.querySelector('#ml-submit');
  if (!btn) return;
  btn.disabled = on;
  btn.setAttribute('aria-busy', String(on));
  if (on) {
    btn.textContent = 'Creando workspace…';
  } else {
    const planConfig = PLANS[activePlan] || PLANS.free;
    btn.textContent  = googleCredential ? 'Crear workspace con Google →' : planConfig.cta;
  }
}

// ============================================================
// FORM SUBMIT
// ============================================================
async function _onFormSubmit(e) {
  e.preventDefault();
  _clearError();

  const form          = e.target;
  const name          = form.querySelector('[name="name"]').value.trim();
  const email         = form.querySelector('[name="email"]').value.trim();
  const password      = form.querySelector('[name="password"]').value;
  const workspaceName = form.querySelector('[name="workspace_name"]').value.trim();

  if (!name)          return _showError('El nombre es obligatorio.');
  if (!email)         return _showError('El email es obligatorio.');
  if (!workspaceName) return _showError('El nombre de la empresa es obligatorio.');
  if (!googleCredential && password.length < 8)
    return _showError('La contraseña debe tener al menos 8 caracteres.');

  _setLoading(true);

  try {
    const payload = googleCredential
      ? await _registerWithGoogle({ id_token: googleCredential, workspace_name: workspaceName })
      : await _registerWithEmail({ name, email, password, workspace_name: workspaceName });

    _handleSuccess(payload);
  } catch (err) {
    _showError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    _setLoading(false);
  }
}

// ============================================================
// API — Registro email / contraseña
// ============================================================
async function _registerWithEmail(data) {
  const res  = await fetch(`${ML.apiBase}/api/v1/auth/registrations`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify({ registration: data }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [].concat(body.errors ?? body.error ?? body.message ?? 'Error al registrarse.').join(' ');
    throw new Error(msg);
  }
  return body;
}

// ============================================================
// API — Registro / login con Google
// Requiere endpoint POST /api/v1/auth/google en el backend
// ============================================================
async function _registerWithGoogle(data) {
  const res  = await fetch(`${ML.apiBase}/api/v1/auth/google`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify({ google: data }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [].concat(body.errors ?? body.error ?? body.message ?? 'Error al autenticar con Google.').join(' ');
    throw new Error(msg);
  }
  return body;
}

// ============================================================
// REDIRECT al app tras éxito
// El app lee el token de los params, lo almacena y limpia la URL
// ============================================================
function _handleSuccess(payload) {
  const token = payload.token ?? payload.auth_token;
  const slug  = payload.workspace_slug ?? payload.workspace?.slug;

  if (!token) {
    // Registro exitoso sin token → redirigir al login del app
    window.location.href = ML.appUrl + '/admin';
    return;
  }

  const dest = new URL('/admin', ML.appUrl);
  dest.searchParams.set('token',    token);
  if (slug)        dest.searchParams.set('workspace', slug);
  if (activePlan)  dest.searchParams.set('plan',      activePlan);

  window.location.href = dest.toString();
}

// ============================================================
// BINDING — conecta todos los botones con data-register
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // CTAs de registro
  document.querySelectorAll('[data-register]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openRegister(el.dataset.register || 'free');
    });
  });

  // Form submit
  document.querySelector('#ml-form')?.addEventListener('submit', _onFormSubmit);

  // Cerrar al hacer click en el backdrop
  document.getElementById('ml-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeRegister();
  });

  // Init Google Sign-In (el script externo puede cargar después)
  if (document.readyState === 'complete') {
    _initGoogle();
  } else {
    window.addEventListener('load', _initGoogle);
  }
});
