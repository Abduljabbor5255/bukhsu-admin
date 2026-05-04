/**
 * REST adapter for buxdu-next API.
 * Maps CoreAxios-style method calls to proper REST verbs.
 * Wraps array responses to { result, meta } so existing views work unchanged.
 */
import axios from 'axios'

const BASE_URL    = import.meta.env.VITE_BUXDU_NEXT_URL  || 'http://localhost:3000'
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN      || 'thinkopolis-admin'

function createInstance() {
  const inst = axios.create({ baseURL: BASE_URL })

  inst.interceptors.request.use(cfg => {
    cfg.headers['x-admin-token'] = ADMIN_TOKEN
    return cfg
  })

  // Normalize responses so views can read data.result / data.meta.total
  inst.interceptors.response.use(res => {
    const raw = res.data
    if (Array.isArray(raw)) {
      res.data = { result: raw, data: raw, meta: { total: raw.length }, total: raw.length }
    } else if (raw && typeof raw === 'object' && !raw.result) {
      res.data = { result: raw, data: raw }
    }
    return res
  })

  return inst
}

export class BuxduNextService {
  constructor(endpoint) {
    this._endpoint = endpoint            // e.g. '/api/news'
    this._inst     = createInstance()
  }

  /** GET /api/{type}?page=&limit=&search=&... */
  findAll(params = {}) {
    const p = params.params || params
    const query = new URLSearchParams()
    if (p.page)     query.set('page',   p.page)
    if (p.limit)    query.set('limit',  p.limit)
    if (p.search)   query.set('search', p.search)
    if (p.category) query.set('category', p.category)
    if (p.draft !== undefined) query.set('draft', p.draft)
    const qs = query.toString()
    return this._inst.get(`${this._endpoint}${qs ? '?' + qs : ''}`)
  }

  /** GET /api/{type}/{id} */
  findOne(params = {}) {
    const p  = params.params || params
    const id = p.id || p._id
    return this._inst.get(`${this._endpoint}/${id}`)
  }

  /** POST /api/{type} */
  create(params = {}) {
    const body = params.params || params
    return this._inst.post(this._endpoint, body)
  }

  /** PUT /api/{type}/{id} */
  update(params = {}) {
    const p  = params.params || params
    const id = p.id || p._id
    const { id: _id, _id: __id, ...body } = p
    void _id; void __id
    return this._inst.put(`${this._endpoint}/${id}`, body)
  }

  /** DELETE /api/{type}/{id} */
  remove(params = {}) {
    const p  = params.params || params
    const id = p.id || p._id
    return this._inst.delete(`${this._endpoint}/${id}`)
  }

  /** Raw GET helper */
  get(url, cfg) { return this._inst.get(url, cfg) }

  /** Raw POST helper */
  post(url, body, cfg) { return this._inst.post(url, body, cfg) }
}
