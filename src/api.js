const API_URL = (
  import.meta.env.VITE_API_URL || 'https://espindola-api.argproseries.workers.dev'
).replace(/\/+$/, '');

const SESSION_STORAGE_KEY = 'espindola_admin_session_token';

let memoryAdminToken = '';

function getAdminSessionToken() {
  if (memoryAdminToken) return memoryAdminToken;
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
    memoryAdminToken = saved;
    return saved;
  } catch {
    return '';
  }
}

export function setAdminSessionToken(token) {
  memoryAdminToken = (token || '').trim();
  try {
    if (memoryAdminToken) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, memoryAdminToken);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignorar si sessionStorage no está disponible
  }
}

export function clearAdminSessionToken() {
  setAdminSessionToken('');
}

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      sp.set(k, String(v));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

function buildAuthHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  const token = getAdminSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildAuthHeaders(options.headers || {})
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Error HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  async login(email, password) {
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data?.isAdmin && data?.adminToken) {
        setAdminSessionToken(data.adminToken);
      } else {
        clearAdminSessionToken();
      }
      return { data, error: null };
    } catch (error) {
      clearAdminSessionToken();
      return { data: null, error };
    }
  },
  logout() {
    clearAdminSessionToken();
  },
  from(table) {
    return {
      async select(params = {}) {
        try {
          const data = await request(`/api/${table}${buildQuery(params)}`);
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async getById(id) {
        try {
          const data = await request(`/api/${table}/${encodeURIComponent(id)}`);
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async insert(payload, { upsert = false } = {}) {
        try {
          const qs = upsert ? '?upsert=true' : '';
          const data = await request(`/api/${table}${qs}`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async update(payload, params = {}) {
        try {
          const data = await request(`/api/${table}${buildQuery(params)}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
          });
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      async delete(params = {}) {
        try {
          const data = await request(`/api/${table}${buildQuery(params)}`, {
            method: 'DELETE'
          });
          return { data, error: null };
        } catch (error) {
          return { data, error };
        }
      }
    };
  },
  async getTablaCampeonato(campeonatoId) {
    try {
      const data = await request(`/api/campeonatos/${encodeURIComponent(campeonatoId)}/tabla`);
      return { data, error: null };
    } catch (error) {
      return { data, error: null };
    }
  }
};