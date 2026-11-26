const API_BASE_URL = 'https://espindola-api.argproseries.workers.dev';
const SESSION_STORAGE_KEY = 'espindola_session_token';

let memorySessionToken = '';

function getSessionToken() {
  if (memorySessionToken) return memorySessionToken;
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
    memorySessionToken = saved;
    return saved;
  } catch {
    return '';
  }
}

export function setSessionToken(token) {
  memorySessionToken = (token || '').trim();
  try {
    if (memorySessionToken) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, memorySessionToken);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignorar si sessionStorage no está disponible
  }
}

export function clearSessionToken() {
  setSessionToken('');
}

function buildAuthHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  const token = getSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function buildQueryString(filters = {}, extra = {}) {
  const params = new URLSearchParams();

  for (const [key, val] of Object.entries(filters || {})) {
    if (val === undefined || val === null || val === '') continue;
    if (key.startsWith('eq_') || key.startsWith('in_')) {
      params.set(key, Array.isArray(val) ? val.join(',') : String(val));
    } else {
      params.set(`eq_${key}`, String(val));
    }
  }

  for (const [key, val] of Object.entries(extra || {})) {
    if (val === undefined || val === null || val === '') continue;
    params.set(key, String(val));
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildAuthHeaders(options.headers || {})
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && (json.error || json.message)) ||
      `Error HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._filters = {};
    this._order = null;
    this._limit = null;
    this._single = false;
  }

  eq(column, value) {
    this._filters[`eq_${column}`] = value;
    return this;
  }

  in(column, values) {
    this._filters[`in_${column}`] = Array.isArray(values) ? values.join(',') : values;
    return this;
  }

  order(column, { ascending = true } = {}) {
    this._order = `${column}.${ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  async select(filters = {}) {
    try {
      const mergedFilters = { ...this._filters, ...filters };
      const qs = buildQueryString(mergedFilters, {
        order: this._order,
        limit: this._limit
      });
      const data = await request(`/api/${this.table}${qs}`, { method: 'GET' });
      if (this._single) {
        return { data: Array.isArray(data) ? (data[0] ?? null) : data, error: null };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async insert(payload, { upsert = false } = {}) {
    try {
      const qs = upsert ? '?upsert=true' : '';
      const data = await request(`/api/${this.table}${qs}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async upsert(payload) {
    return this.insert(payload, { upsert: true });
  }

  async update(payload, filters = {}) {
    try {
      const mergedFilters = { ...this._filters, ...filters };
      const qs = buildQueryString(mergedFilters);
      const data = await request(`/api/${this.table}${qs}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async delete(filters = {}) {
    try {
      const mergedFilters = { ...this._filters, ...filters };
      const qs = buildQueryString(mergedFilters);
      const data = await request(`/api/${this.table}${qs}`, {
        method: 'DELETE'
      });
      return { data, error: null };
    } catch (error) {
      return { data, error: null };
    }
  }
}

export const api = {
  from(table) {
    return new QueryBuilder(table);
  },

  async login(email, password) {
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const token = data?.sessionToken || data?.adminToken || '';
      if (token) {
        setSessionToken(token);
      } else {
        clearSessionToken();
      }
      return { data, error: null };
    } catch (error) {
      clearSessionToken();
      return { data: null, error };
    }
  },

  logout() {
    clearSessionToken();
  },

  async getTablaCampeonato(campeonatoId) {
    try {
      const data = await request(`/api/campeonatos/${encodeURIComponent(campeonatoId)}/tabla`, {
        method: 'GET'
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};