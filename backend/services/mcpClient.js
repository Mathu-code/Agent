import axios from 'axios'

const MCP_ENDPOINT = 'https://mcp.kapruka.com/mcp'

const mcpClient = axios.create({
  baseURL: MCP_ENDPOINT,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream'
  }
})

let sessionId = null

async function initializeSession() {
  if (sessionId) return sessionId
  try {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'kapruka-agent',
          version: '1.0.0'
        }
      }
    }
    const response = await mcpClient.post('', payload)
    if (response.headers['mcp-session-id'] || response.headers['mcpsession']) {
      sessionId = response.headers['mcp-session-id'] || response.headers['mcpsession']
      mcpClient.defaults.headers.common['mcp-session-id'] = sessionId
    }
    return sessionId
  } catch (error) {
    console.error('MCP initialize error:', error.message)
    return null
  }
}

function parseSSE(rawText) {
  if (typeof rawText !== 'string') return []
  const lines = rawText.split('\n')
  const events = []
  let currentEvent = null

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      const data = line.slice(6).trim()
      if (data) {
        events.push({ event: currentEvent, data })
      }
    }
  }

  if (events.length === 0 && rawText.trim()) {
    try {
      const parsed = JSON.parse(rawText.trim())
      return [parsed]
    } catch {
      return []
    }
  }

  return events.map(e => {
    try { return JSON.parse(e.data) } catch { return e.data }
  })
}

function normalizeMcpResponse(parsed) {
  if (!parsed || parsed.length === 0) return {}
  for (const item of parsed) {
    if (item.result) {
      const result = item.result
      if (result.content && Array.isArray(result.content)) {
        const textParts = result.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
        if (textParts.length > 0) {
          const raw = textParts.join('\n')
          const structured = result.structuredContent
          if (structured && typeof structured === 'object' && !structured.result) {
            return structured
          }
          return parseToolResult(raw)
        }
      }
      return result
    }
    if (item.error) {
      throw new Error(item.error.message || 'MCP error')
    }
  }
  return {}
}

function parseToolResult(raw) {
  if (!raw || typeof raw !== 'string') return {}

  // Parse search results
  const searchMatch = raw.match(/## Kapruka search: "(.*?)"\n\nShowing (\d+) results.*?\n\n([\s\S]+)/)
    || raw.match(/## Kapruka search: "(.*?)"\nShowing (\d+) results.*?\n\n([\s\S]+)/)
  if (searchMatch) {
    const products = parseSearchResults(raw)
    return { query: searchMatch[1], total: parseInt(searchMatch[2]) || products.length, products }
  }

  // Parse product details
  const productMatch = raw.match(/^## (.+?)$/m)
  if (productMatch && raw.includes('**ID**:')) {
    return parseProductDetails(raw)
  }

  // Parse categories
  if (raw.includes('## Kapruka Categories')) {
    return parseCategories(raw)
  }

  // Parse delivery info
  if (raw.includes('Deliverable') || raw.includes('Rate:') || raw.includes('delivery')) {
    return parseDeliveryResult(raw)
  }

  // Parse order confirmation
  if (raw.includes('Order') && raw.includes('pay link')) {
    return parseOrderResult(raw)
  }

  // Parse track order
  if (raw.includes('Status') || raw.includes('Tracking')) {
    return parseTrackResult(raw)
  }

  return { raw }
}

function parseSearchResults(raw) {
  const products = []
  const blocks = raw.split(/\*\*\d+\./).slice(1)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    const nameLine = lines[0]?.trim() || ''
    const name = nameLine.replace(/\*\*/g, '').trim()

    const idMatch = block.match(/ID: `([^`]+)`/)
    const priceMatch = block.match(/LKR\s+([\d,]+)/)
    const stockMatch = block.match(/In stock\s*(\(low\))?/i)
    const urlMatch = block.match(/\[View product\]\(([^)]+)\)/)

    if (idMatch) {
      products.push({
        id: idMatch[1],
        name: name || 'Unknown',
        price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0,
        in_stock: !!stockMatch,
        url: urlMatch ? urlMatch[1] : '',
        image_url: '',
        rating: null,
        description: ''
      })
    }
  }

  return products
}

function parseProductDetails(raw) {
  const titleMatch = raw.match(/^## (.+?)$/m)
  const idMatch = raw.match(/\*\*ID\*\*:\s*`([^`]+)`/)
  const priceMatch = raw.match(/\*\*Price\*\*:\s*LKR\s+([\d,]+)/)
  const stockMatch = raw.match(/\*\*Stock\*\*:\s*(.+)/)
  const categoryMatch = raw.match(/\*\*Category\*\*:\s*(.+)/)
  const vendorMatch = raw.match(/\*\*Vendor\*\*:\s*(.+)/)
  const imageMatch = raw.match(/\*\*Image\*\*:\s*(\S+)/)
  const urlMatch = raw.match(/\[View on Kapruka\]\(([^)]+)\)/)

  let description = ''
  if (imageMatch) {
    const beforeImage = raw.split(/\*\*Image\*\*:/)[0]
    const lines = beforeImage.split('\n')
    const cleanLines = lines.filter(l => {
      const t = l.trim()
      return t.length > 0 && !t.startsWith('**') && !t.startsWith('##') && !t.startsWith('ID:') && !t.startsWith('Price:') && !t.startsWith('Stock:') && !t.startsWith('Category:') && !t.startsWith('Vendor:') && !t.startsWith('Weight:') && !t.startsWith('International') && !t.startsWith('[View')
    })
    description = cleanLines.join(' ').trim().substring(0, 300)
  }

  return {
    id: idMatch ? idMatch[1] : '',
    name: titleMatch ? titleMatch[1].replace(/\*\*/g, '').trim() : 'Unknown',
    price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0,
    selling_price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0,
    in_stock: stockMatch ? !stockMatch[1].toLowerCase().includes('out') : true,
    category: categoryMatch ? categoryMatch[1].trim() : '',
    seller: vendorMatch ? vendorMatch[1].trim() : '',
    image_url: imageMatch ? imageMatch[1] : '',
    url: urlMatch ? urlMatch[1] : '',
    description: description || raw.substring(0, 200)
  }
}

function parseCategories(raw) {
  const categories = []
  const matches = raw.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)/g)
  for (const m of matches) {
    categories.push({ name: m[1], url: m[2] })
  }
  return categories
}

function parseDeliveryResult(raw) {
  const deliverableMatch = raw.match(/Deliverable:\s*(Yes|No|True|False)/i)
  const rateMatch = raw.match(/Rate:\s*LKR\s+([\d,.]+)/)
  const perishableMatch = raw.match(/Perishable/i)

  return {
    can_deliver: deliverableMatch ? /yes|true/i.test(deliverableMatch[1]) : false,
    rate: rateMatch ? parseFloat(rateMatch[1].replace(/,/g, '')) : null,
    perishable_warning: !!perishableMatch,
    raw
  }
}

function parseOrderResult(raw) {
  const orderMatch = raw.match(/Order number[:\s]+([A-Z0-9]+)/i)
  const payLinkMatch = raw.match(/(https?:\/\/[^\s]+)/)

  return {
    order_number: orderMatch ? orderMatch[1] : '',
    pay_link: payLinkMatch ? payLinkMatch[1] : '',
    raw
  }
}

function parseTrackResult(raw) {
  const statusMatch = raw.match(/Status[:\s]+(.+)/i)
  const orderMatch = raw.match(/Order[:\s]+([A-Z0-9]+)/i)

  return {
    order_number: orderMatch ? orderMatch[1] : '',
    status: statusMatch ? statusMatch[1].trim() : 'Unknown',
    raw
  }
}

async function callTool(toolName, args = {}) {
  try {
    await initializeSession()
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }
    const response = await mcpClient.post('', payload)
    const raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseSSE(raw)
    return normalizeMcpResponse(parsed)
  } catch (error) {
    console.error(`MCP tool ${toolName} error:`, error.message)
    if (error.response) {
      const raw = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)
      const parsed = parseSSE(raw)
      const normalized = normalizeMcpResponse(parsed)
      if (normalized && Object.keys(normalized).length > 0) return normalized
    }
    throw new Error(`Failed to call ${toolName}: ${error.message}`)
  }
}

export const searchProducts = async (params) => {
  const args = {
    params: {
      q: (params.q || '').trim(),
      category: params.category || undefined,
      min_price: params.min_price || undefined,
      max_price: params.max_price || undefined,
      in_stock_only: params.in_stock_only !== false,
      sort: params.sort || 'newest',
      limit: params.limit || 20,
      cursor: params.cursor || undefined,
      currency: params.currency || 'LKR'
    }
  }
  Object.keys(args.params).forEach(k => args.params[k] === undefined && delete args.params[k])
  return callTool('kapruka_search_products', args)
}

export const getProduct = async (productId, currency = 'LKR') => {
  return callTool('kapruka_get_product', { params: { product_id: productId, currency } })
}

export const listCategories = async (depth = 1) => {
  return callTool('kapruka_list_categories', { params: { depth } })
}

export const listDeliveryCities = async (query, limit = 20) => {
  return callTool('kapruka_list_delivery_cities', { params: { query, limit } })
}

export const checkDelivery = async (city, deliveryDate, productId) => {
  return callTool('kapruka_check_delivery', {
    params: {
      city,
      delivery_date: deliveryDate,
      product_id: productId
    }
  })
}

export const createOrder = async (orderData) => {
  const args = {
    params: {
      cart: orderData.cart,
      recipient: orderData.recipient,
      delivery: orderData.delivery,
      sender: orderData.sender || undefined,
      gift_message: orderData.giftMessage || undefined,
      currency: orderData.currency || 'LKR'
    }
  }
  Object.keys(args.params).forEach(k => args.params[k] === undefined && delete args.params[k])
  return callTool('kapruka_create_order', args)
}

export const trackOrder = async (orderNumber) => {
  return callTool('kapruka_track_order', { params: { order_number: orderNumber } })
}

export default {
  searchProducts,
  getProduct,
  listCategories,
  listDeliveryCities,
  checkDelivery,
  createOrder,
  trackOrder
}
