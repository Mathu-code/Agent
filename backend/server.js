import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import * as mcpClient from './services/mcpClient.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(bodyParser.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// Chat endpoint - receives user message and sends agent response
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Simple agent logic - search for products based on keywords
    let reply = ''
    const lowerMessage = message.toLowerCase()

    // Check if user is searching for products
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || 
        lowerMessage.includes('gift') || lowerMessage.includes('buy') ||
        lowerMessage.includes('looking for')) {
      
      // Extract search query
      let searchQuery = message.replace(/search|find|looking for|buy|gift/gi, '').trim()
      if (!searchQuery) searchQuery = 'popular'
async (req, res) => {
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
    console.error('Search error:', error)
    res.status(500).json({ error: error.messagehop today? You can ask me to:\n• Search for products\n• Find gifts\n• Check delivery options\n• Complete your checkout`
    }

    res.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Kapruka MCP endpoint - search products
app.post('/search-products', (req, res) => {
  try {
    const { query, category, minPrice, maxPrice } = req.body
    
    // TODO: Call Kapruka MCP kapruka_search_products here
    
    res.json({
      products: [],
      message: 'Product search endpoint - MCP integration coming soon'
    })
  } catch (error) {
    console.error('Search errorasync (req, res) => {
  try {
    const { productId } = req.params
    const { currency } = req.query

    const product = await mcpClient.getProduct(productId, currency || 'LKR')
    res.json(product)
  } catch (error) {
    console.error('Product error:', error)
    res.status(500).json({ error: error.message
      product: null,
      message: 'Product details endpoint - MCP integration coming soon'
    })
  } catch (error) {
    console.error('Product error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})async (req, res) => {
  try {
    const { depth } = req.query
    const categories = await mcpClient.listCategories(depth || 1)
    res.json(categories)
  } catch (error) {
    console.error('Categories error:', error)
    res.status(500).json({ error: error.message
  } catch (error) {
    console.error('Categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Kapruka MCP endpoint - check delivery
app.post('/check-delivery', (req, res) => {
  try {
    const { city, deliveryDate, productId } = req.body
    
    // TODO: Call Kapruka MCP kapruka_check_delivery here
    
    res.json({async (req, res) => {
  try {
    const { city, deliveryDate, productId } = req.body

    if (!city || !deliveryDate || !productId) {
      return res.status(400).json({ error: 'city, deliveryDate, and productId are required' })
    }

    const delivery = await mcpClient.checkDelivery(city, deliveryDate, productId)
    res.json(delivery)
  } catch (error) {
    console.error('Delivery check error:', error)
    res.status(500).json({ error: error.message
    const { cart, recipient, delivery, sender, giftMessage } = req.body
    
    // TODO: Call Kapruka async (req, res) => {
  try {
    const { cart, recipient, delivery, sender, giftMessage, currency } = req.body

    if (!cart || !recipient || !delivery) {
      return res.status(400).json({ error: 'cart, recipient, and delivery are required' })
    }

    const order = await mcpClient.createOrder({
      cart,
      recipient,
      delivery,
      sender,
      giftMessage,
      currency: currency || 'LKR'
    })

    res.json(order)
  } catch (error) {async (req, res) => {
  try {
    const { orderNumber } = req.params

    const order = await mcpClient.trackOrder(orderNumber)
    res.json(order)
  } catch (error) {
    console.error('Order tracking error:', error)
    res.status(500).json({ error: error.message
  } catch (error) {
    console.error('Order tracking error:', error)
    res.status(500).json({ error: 'Order tracking failed' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kapruka Backend Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
