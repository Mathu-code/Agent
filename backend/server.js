import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'

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
app.post('/chat', (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // TODO: Integrate with Kapruka MCP here
    // For now, return a placeholder response
    const reply = `You said: "${message}". This is a placeholder response. Integration with Kapruka MCP coming soon!`

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
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Kapruka MCP endpoint - get product details
app.get('/product/:productId', (req, res) => {
  try {
    const { productId } = req.params
    
    // TODO: Call Kapruka MCP kapruka_get_product here
    
    res.json({
      product: null,
      message: 'Product details endpoint - MCP integration coming soon'
    })
  } catch (error) {
    console.error('Product error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// Kapruka MCP endpoint - list categories
app.get('/categories', (req, res) => {
  try {
    // TODO: Call Kapruka MCP kapruka_list_categories here
    
    res.json({
      categories: [],
      message: 'Categories endpoint - MCP integration coming soon'
    })
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
    
    res.json({
      canDeliver: false,
      rate: 0,
      message: 'Delivery check endpoint - MCP integration coming soon'
    })
  } catch (error) {
    console.error('Delivery check error:', error)
    res.status(500).json({ error: 'Delivery check failed' })
  }
})

// Kapruka MCP endpoint - create order (guest checkout)
app.post('/create-order', (req, res) => {
  try {
    const { cart, recipient, delivery, sender, giftMessage } = req.body
    
    // TODO: Call Kapruka MCP kapruka_create_order here
    
    res.json({
      orderId: null,
      payLink: null,
      message: 'Order creation endpoint - MCP integration coming soon'
    })
  } catch (error) {
    console.error('Order creation error:', error)
    res.status(500).json({ error: 'Order creation failed' })
  }
})

// Kapruka MCP endpoint - track order
app.get('/track-order/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params
    
    // TODO: Call Kapruka MCP kapruka_track_order here
    
    res.json({
      order: null,
      message: 'Order tracking endpoint - MCP integration coming soon'
    })
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
