import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import * as mcpClient from './services/mcpClient.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// Chat endpoint: simple intent parser that searches products
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const lower = message.toLowerCase()
    // If user asks to search, run product search
    if (/\b(search|find|buy|gift|looking for)\b/.test(lower)) {
      let q = message.replace(/search|find|buy|gift|looking for/gi, '').trim()
      if (!q) q = 'popular'
      try {
        const results = await mcpClient.searchProducts({ q, limit: 12 })
        // MCP responses may vary; normalize
        const products = results.products || results.items || []
        const reply = `Found ${products.length} product(s) for "${q}".`
        return res.json({ reply, products, action: 'show_products' })
      } catch (err) {
        console.error('chat search error', err)
        return res.json({ reply: "Sorry — I couldn't search right now. Try again." })
      }
    }

    // Default reply
    return res.json({ reply: `Hi! Tell me what you want to search for (e.g. "Find flowers", "Search headphones").` })
  } catch (error) {
    console.error('Chat error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Search products (direct API)
app.post('/search-products', async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, sort, limit } = req.body
    const params = {
      q: query || '',
      category: category || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      sort: sort || 'newest',
      limit: limit || 20,
      in_stock_only: true
    }
    const results = await mcpClient.searchProducts(params)
    res.json(results)
  } catch (error) {
    console.error('Search error', error)
    res.status(500).json({ error: error.message || 'Search failed' })
  }
})

// Product details
app.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params
    const { currency } = req.query
    const product = await mcpClient.getProduct(productId, currency || 'LKR')
    res.json(product)
  } catch (error) {
    console.error('Product error', error)
    res.status(500).json({ error: error.message || 'Failed to fetch product' })
  }
})

// Categories
app.get('/categories', async (req, res) => {
  try {
    const { depth } = req.query
    const categories = await mcpClient.listCategories(depth || 1)
    res.json(categories)
  } catch (error) {
    console.error('Categories error', error)
    res.status(500).json({ error: error.message || 'Failed to fetch categories' })
  }
})

// Delivery city search
app.get('/cities', async (req, res) => {
  try {
    const { q, limit } = req.query
    if (!q) return res.status(400).json({ error: 'query param q is required' })
    const cities = await mcpClient.listDeliveryCities(q, parseInt(limit) || 20)
    res.json(cities)
  } catch (error) {
    console.error('Cities error', error)
    res.status(500).json({ error: error.message || 'Failed to fetch cities' })
  }
})

// Check delivery
app.post('/check-delivery', async (req, res) => {
  try {
    const { city, deliveryDate, productId } = req.body
    if (!city || !deliveryDate || !productId) return res.status(400).json({ error: 'city, deliveryDate and productId are required' })
    const delivery = await mcpClient.checkDelivery(city, deliveryDate, productId)
    res.json(delivery)
  } catch (error) {
    console.error('Delivery check error', error)
    res.status(500).json({ error: error.message || 'Delivery check failed' })
  }
})

// Create order (guest checkout)
app.post('/create-order', async (req, res) => {
  try {
    const { cart, recipient, delivery, sender, giftMessage, currency } = req.body
    if (!cart || !recipient || !delivery) return res.status(400).json({ error: 'cart, recipient and delivery are required' })
    const order = await mcpClient.createOrder({ cart, recipient, delivery, sender, giftMessage, currency: currency || 'LKR' })
    // Normalize pay link field names from MCP (pay_link | payLink | payment_url)
    const normalized = {
      ...order,
      pay_link: order.pay_link || order.payLink || order.paylink || order.payment_url || null
    }
    res.json(normalized)
  } catch (error) {
    console.error('Order creation error', error)
    res.status(500).json({ error: error.message || 'Order creation failed' })
  }
})

// Track order
app.get('/track-order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params
    const order = await mcpClient.trackOrder(orderNumber)
    res.json(order)
  } catch (error) {
    console.error('Order tracking error', error)
    res.status(500).json({ error: error.message || 'Order tracking failed' })
  }
})

// Start
app.listen(PORT, () => {
  console.log(`🚀 Kapruka Backend Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
