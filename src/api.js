const API_URL = (
  import.meta.env.VITE_API_URL || 'https://espindola-api.argproseries.workers.dev'
).replace(/\/+$/, '');

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

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Error HTTP ${res.status}`);
  }
  return data;
}

export const api = {
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
          return { data: null, error };
        }
      }
    };
  },
  async getTablaCampeonato(campeonatoId) {
    try {
      const data = await request(`/api/campeonatos/${encodeURIComponent(campeonatoId)}/tabla`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};