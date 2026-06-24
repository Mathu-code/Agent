import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import * as mcpClient from './services/mcpClient.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(bodyParser.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// Chat endpoint with agent personality
app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId: sid, mode = 'self', locale = 'en' } = req.body
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const lower = message.toLowerCase()
    const searchIntent = /\b(search|find|buy|gift|looking for|show|want|need|venum|sollu|අවශ්‍ය|සෙවීම|හඳුන්වන්න|පෙන්වන්න|காட்டு|தேடு)\b/i
    
    if (searchIntent.test(lower) || lower.length > 2) {
      let q = message
      const stopWords = /^(search|find|buy|gift|looking for|show|want|need|i want|i need|i am looking for|can you|please|find me|get me|show me|help me find|i need|find|තෝරන්න|හඳුන්වන්න|පෙන්වන්න|sollu|kastapadra|kad sutry)/i
      q = q.replace(stopWords, '').trim()
      if (!q || q.length < 2) q = message

      try {
        const results = await mcpClient.searchProducts({ 
          q, 
          limit: 16, 
          sort: 'newest',
          in_stock_only: true
        })
        
        const products = results.products || []
        const reply = buildReply(message, mode, locale, products, results)
        return res.json({ 
          reply, 
          products,
          action: 'show_products',
          total: results.total || products.length
        })
      } catch (err) {
        console.error('chat search error', err)
        return res.json({ 
          reply: mode === 'gift' 
            ? "Aiyo — my search just glitched. Try again and I'll find something great." 
            : "Sorry — couldn't search right now. Give me a sec and try again.",
          action: 'error'
        })
      }
    }

    const reply = buildReply(message, mode, locale, [])
    return res.json({ reply, action: 'chat' })
  } catch (error) {
    console.error('Chat error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Search products (direct API) - returns structured data
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
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k])
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

// Batch fetch product images for search results
app.post('/product-images', async (req, res) => {
  try {
    const { productIds } = req.body
    if (!productIds || !Array.isArray(productIds)) return res.status(400).json({ error: 'productIds array required' })
    
    const results = {}
    await Promise.allSettled(
      productIds.slice(0, 20).map(async (id) => {
        try {
          const product = await mcpClient.getProduct(id, 'LKR')
          results[id] = {
            image_url: product.image_url || '',
            name: product.name || '',
            price: product.price || product.selling_price || 0
          }
        } catch {
          results[id] = { image_url: '', name: '', price: 0 }
        }
      })
    )
    res.json(results)
  } catch (error) {
    console.error('Batch images error', error)
    res.status(500).json({ error: error.message || 'Failed to fetch product images' })
  }
})

// Categories
app.get('/categories', async (req, res) => {
  try {
    const { depth } = req.query
    const categories = await mcpClient.listCategories(depth ? parseInt(depth) : 1)
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
    const normalized = {
      ...order,
      pay_link: order.pay_link || order.payLink || order.paylink || order.payment_url || order.raw?.match(/https?:\/\/[^\s]+/)?.[1] || null
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

function buildReply(message, mode, locale, products = [], searchData = null) {
  const lower = message.toLowerCase()
  
  if (products.length > 0) {
    const total = searchData?.total || products.length
    if (locale === 'ta') {
      return `"${message}" ku ${total} result(s) irruku da! Unku romba suit pannum — add pannu!`
    }
    if (locale === 'si') {
      return `"${message}" සඳහා ${total} නියමිත නිෂ්පාත(ය) හමුවි. අවශ්‍ය න්‍යාය එකතු කරන්න.`
    }
    const phrase = mode === 'gift' ? 'I found some thoughtful options that won\'t feel generic' : 'I found some solid options for you'
    return `${phrase}. ${total} result(s) — tap Add to push them to your cart, or tell me more to narrow it down.`
  }

  if (/thank|thanks|thnx|nandri|stuthi/i.test(lower)) {
    if (locale === 'ta') return 'Welcome da! 👊 Another thing venuma, tell me!'
    if (locale === 'si') return 'ඔබට පුළුවන්! ඕනෑම දෙයක් අහන්න.'
    return "You're welcome! Need anything else?"
  }
  
  if (/price|cheap|budget|under|below|affordable|luxury|expensive/i.test(lower)) {
    if (locale === 'ta') return 'Budget fix panna sollu machan — 5k, 10k, 20k, epavume nenaikkira budget ku range panniduven!'
    if (locale === 'si') return 'ඔබගේ බජට් සීමාව කීයද? මම එයට හරියාගෙන තේරීම් පෙන්වන්න පුළුවන්.'
    return 'Tell me your budget and I will filter down to the best matches. No wasted scrolling.'
  }
  
  if (/deliver|delivery|shipping|arrive|when/i.test(lower)) {
    if (locale === 'ta') return 'City + date sollunga, naan check pannuren. Colombo 1-2 days, outside takes a bit longer.'
    if (locale === 'si') return 'නගරය හා දිනය කියන්න, මම බෙදාහැරෙන ආකාරය පරීක්ෂා කරන්නම්.'
    return 'Pick a city and date and I will check delivery. Colombo is usually next-day.'
  }
  
  if (/help|how|what can|ability/i.test(lower)) {
    if (locale === 'ta') return 'Mela ella help panna mudiyum da: search, compare, delivery check, cart, checkout end-to-end. Enna venumo sollu!'
    if (locale === 'si') return 'මට සොයන්න, සැසිටුවන්න, බෙදාහැරීම පරීක්ෂා කරන්න, ගෙවීම දක්වා මුළු ක්‍රියාවලිය පුරා වැඩි කරන්න පුළුවන්.'
    return "Here's what I can do: search products, compare prices, check delivery, build your cart, and take you all the way to a pay link."
  }
  
  if (/cart|basket|order/i.test(lower)) {
    if (locale === 'ta') return 'Checkout panna sollunga machan!'
    if (locale === 'si') return 'ඔබගේ බඩු මණ්ඩලයට දෑ එකතු කරන්න. රීමතුරු කිරීමට පුළුවන්.'
    return 'Your cart is ready. Say "checkout" when you want to finish the order!'
  }

  if (/^(hi|hey|hello|yo|sup|hlo|halo|colombo|k楼|a.?iyo)/i.test(lower)) {
    return mode === 'gift'
      ? (locale === 'ta' ? 'ஏய் Machan! 🎁 Gift venumna sollu — flowers, chocolate, tech, anything. Naan unkku help pannuren!' : locale === 'si' ? 'ආයුබෝවන්! 🎁 ඕනෑම අවස්ථාවකට ගිft් සොයන්න පුළුවන්.' : "Aiyo! 👋 I see you're shopping for someone special. Tell me the occasion and I'll find something that feels thoughtful.")
      : (locale === 'ta' ? 'ஏய் Machan! 🛍️ Enna venum? Electronics, groceries, fashion, skincare — ellam search panniduven!' : locale === 'si' ? 'ආයුලෝවන්! 🛍️ මොන දෙයක් ඕනේද? ටෙක්, ග්‍රොසරි, ආත්‍ය, ඕනෑම දෙයක් සොයන්න උදව් කරනවා.' : 'Hey! 👋 What are you shopping for today? Headphones, groceries, skincare, a new bag — tell me what you need.')
  }
  
  if (/bye|goodbye|see you|nandri|thunai/i.test(lower)) {
    if (locale === 'ta') return 'Poi varaikum nandri da! Don\'t forget to come back! 👋'
    if (locale === 'si') return 'ආයුබෝවන්! මු谎言 යනතුරු යන්න! 👋'
    return 'See you later! Come back anytime you need something. 👋'
  }

  if (locale === 'ta') return 'Sollu machan — ennena venum? Electronics, gifts, groceries, clothes — naan ella panna mudiyum!'
  if (locale === 'si') return 'ඔබට ඕනෑම දෙයක් පැහැදිලි නැතුව අහන්න. මම උදව් කරන්නම්!'
  return "Tell me a bit more — what category, budget, or occasion? I promise to make it worth your while. 😉"
}

app.listen(PORT, () => {
  console.log(`🚀 Kapruka Backend Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
