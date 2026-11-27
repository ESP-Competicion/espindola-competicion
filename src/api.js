const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://espindolacompeticion.com').replace(/\/+$/, '');
const TOKEN_STORAGE_KEY = 'espindola_session_token';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignorar si storage no está disponible
  }
}

function buildQueryString(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const msg = (json && (json.error || json.message)) || `Error HTTP ${res.status}`;
    const err = new Error(msg);
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

  order(orderStr) {
    this._filters.order = orderStr;
    return this;
  }

  limit(n) {
    this._filters.limit = n;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  async select(params = {}) {
    try {
      const merged = { ...this._filters, ...params };
      const qs = buildQueryString(merged);
      const data = await request(`/api/${this.table}${qs}`, {
        method: 'GET'
      });

      if (this._single) {
        if (Array.isArray(data)) {
          return { data: data[0] || null, error: null };
        }
        return { data: data || null, error: null };
      }

      return { data: Array.isArray(data) ? data : (data ? [data] : []), error: null };
    } catch (error) {
      return { data: this._single ? null : [], error };
    }
  }

  async insert(payload, options = {}) {
    try {
      const qs = buildQueryString(options);
      const data = await request(`/api/${this.table}${qs}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const row = Array.isArray(data) ? data[0] : data;
      return { data: row, error: null };
    } catch (error) {
      return { data: null, error };
    }
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
      return { data: null, error };
    }
  }
}

export const api = {
  from(table) {
    return new QueryBuilder(table);
  },

  setSessionToken(token) {
    setToken(token);
  },

  getSessionToken() {
    return getToken();
  },

  logout() {
    setToken('');
  },

  async login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  async register(payload) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data?.token) {
      setToken(data.token);
    }
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async getTablaCampeonato(campeonatoId) {
    try {
      const qs = buildQueryString({ campeonato_id: campeonatoId });
      const data = await request(`/api/campeonatos/tabla${qs}`, {
        method: 'GET'
      });
      return { data: Array.isArray(data) ? data : [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};