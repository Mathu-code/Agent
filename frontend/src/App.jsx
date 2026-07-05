import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import ProductCard from './components/ProductCard'
import Cart from './components/Cart'
import DeliveryModal from './components/DeliveryModal'
import CheckoutModal from './components/CheckoutModal'
import OrderSuccessModal from './components/OrderSuccessModal'
import { t, availableLocales } from './i18n/i18n'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const api = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
const SESSION_ID = 'session_default_' + Math.random().toString(36).slice(2)

async function fetchWithTimeout(url, options = {}, timeout = 20000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

function App() {
  const [locale, setLocale] = useState('en')
  const [mode, setMode] = useState('self')
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'agent',
      text: t('en', 'welcome'),
      timestamp: new Date()
    }
  ])
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentProducts, setCurrentProducts] = useState([])
  const [showProducts, setShowProducts] = useState(false)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const quickPrompts = mode === 'gift'
    ? [
        'Flowers for my girlfriend with note',
        'Gift under 3000 LKR for birthday',
        'Anniversary gift with delivery tomorrow'
      ]
    : [
        'Best headphones under 12000 LKR',
        'Groceries delivered tomorrow',
        'Laptop bag and wireless mouse'
      ]

  const getModeSpecificPrompt = () => {
    const moods = {
      self: [
        'I need a new phone case',
        'Groceries for the week',
        'Gaming mouse under 5k',
        'Office chair for my back pain',
        'Birthday gift for my sister'
      ],
      gift: [
        'My girlfriend broke up with me...',
        'Flowers that say "sorry"',
        'Gift for my mom\'s birthday',
        'Surprise my best friend',
        'Anniversary gift ideas'
      ]
    }
    return moods[mode] || moods.self
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showProducts])

  useEffect(() => {
    setMessages(prev => prev.map((msg, i) => i === 0 ? { ...msg, text: t(locale, 'welcome') } : msg))
  }, [locale])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetchWithTimeout(api('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID, mode, locale })
      })
      const data = await res.json()

      const agentMessage = {
        id: Date.now() + 1,
        type: 'agent',
        text: data.reply,
        products: data.products || [],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])

      if (data.products && data.products.length > 0) {
        let products = data.products
        setCurrentProducts(products)
        setShowProducts(true)

        const ids = products.map(p => p.id).filter(Boolean)
        if (ids.length > 0) {
          try {
             const imgRes = await fetch(api('/api/product-images'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: ids })
            })
            const imgData = await imgRes.json()
            const enriched = products.map(p => ({
              ...p,
              image_url: imgData[p.id]?.image_url || p.image_url || '',
              price: imgData[p.id]?.price || p.price
            }))
            setCurrentProducts(enriched)
          } catch {
            // proceed without enriched images
          }
        }
      }
    } catch (err) {
      console.error('Chat error', err)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'agent',
        text: t(locale, 'error_default'),
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }, [mode, locale])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price || product.selling_price || 0,
        image_url: product.image_url,
        quantity: 1
      }]
    })
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'agent',
      text: t(locale, 'added_to_cart').replace('{name}', product.name),
      timestamp: new Date()
    }])
  }

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId))
  }

  const handleCheckout = () => {
    setShowProducts(false)
    setCartOpen(false)
    setDeliveryOpen(true)
  }

  const handleDeliveryConfirm = ({ city, date, delivery }) => {
    const msg = {
      id: Date.now(),
      type: 'agent',
      text: t(locale, 'delivery_confirmed').replace('{city}', city.name || city).replace('{date}', date),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, msg])
    setDeliveryOpen(false)
    setDeliveryInfo({ city, date, delivery })
    setCheckoutOpen(true)
  }

  const handleViewDetails = async (product) => {
    if (!product || !product.id) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        text: 'Product details unavailable. Please try searching again.',
        timestamp: new Date()
      }])
      return
    }
    try {
      const res = await fetchWithTimeout(api(`/api/product/${encodeURIComponent(product.id)}?currency=LKR`))
      const data = await res.json()
      if (!data || data.error) {
        throw new Error(data?.error || 'No data received')
      }
      const name = data.name || product.name
      const price = data.price || data.selling_price || product.price || 0
      const desc = data.description && data.description.length > 2 && !data.description.startsWith('##') && !data.description.startsWith('**')
        ? data.description.substring(0, 200)
        : ''
      const seller = data.seller ? `\nBy: ${data.seller}` : ''
      const category = data.category ? `\nCategory: ${data.category}` : ''
      const stock = data.in_stock !== false ? '✅ In Stock' : '❌ Out of Stock'
      const detailText = `📋 ${name}\n💰 Price: LKR ${price.toLocaleString()}\n📦 ${stock}${seller}${category}${desc ? '\n\n' + desc : ''}`
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        text: detailText,
        timestamp: new Date()
      }])
    } catch (err) {
      console.error('View details error:', err)
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        text: `📋 ${product.name}\n💰 Price: LKR ${(product.price || product.selling_price || 0).toLocaleString()}\n📦 ${product.in_stock !== false ? '✅ In Stock' : '❌ Out of Stock'}`,
        timestamp: new Date()
      }])
    }
  }

  const handleOrderSuccess = (orderData) => {
    setLastOrder(orderData)
    setOrderSuccessOpen(true)
    setCheckoutOpen(false)
  }

  const handleCloseSuccess = () => {
    setOrderSuccessOpen(false)
    setCart([])
    setCurrentProducts([])
    setShowProducts(false)
  }

  const handleTrackOrder = async (orderNumber) => {
    try {
      const res = await fetchWithTimeout(api(`/api/track-order/${orderNumber}`))
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        text: t(locale, 'track_result')
          .replace('{status}', data.status || 'Processing')
          .replace('{order}', orderNumber),
        timestamp: new Date()
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        text: t(locale, 'track_error'),
        timestamp: new Date()
      }])
    }
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <h1>{t(locale, 'title')}</h1>
            <p className="header-subtitle">
              Live Kapruka MCP • guest checkout • Sri Lanka-first shopping
            </p>
          </div>
          <div className="header-right">
            <select value={locale} onChange={(e) => setLocale(e.target.value)} className="locale-select">
              {availableLocales.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button className="cart-button" onClick={() => setCartOpen(!cartOpen)}>
              <span className="cart-icon">🛒</span>
              <span className="cart-count">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            </button>
          </div>
        </div>

<div className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Kapruka Agent Challenge 2026</span>
            <h2>{mode === 'gift' ? 'Tell me the person, not just the item.' : 'Tell me the mood, not just the item.'}</h2>
            <p>
              {mode === 'gift'
                ? 'I can help you find the perfect gift with personality, check delivery, add a note, and finish checkout in one flow.'
                : 'I can help you shop for yourself, compare prices, check delivery, and finish checkout with a simple pay link.'}
            </p>
            <div className="mode-switcher">
              <button className={`mode-pill ${mode === 'self' ? 'active' : ''}`} onClick={() => setMode('self')} type="button">😎 For me</button>
              <button className={`mode-pill ${mode === 'gift' ? 'active' : ''}`} onClick={() => setMode('gift')} type="button">🎁 For someone else</button>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <strong>⚡ Live</strong>
              <span>catalog search</span>
            </div>
            <div className="stat-card">
              <strong>🚚 Fast</strong>
              <span>delivery quotes</span>
            </div>
            <div className="stat-card">
              <strong>💳 One-tap</strong>
              <span>pay link checkout</span>
            </div>
          </div>
        </div>
            
        <div className="chat-content">
          <div className="quick-actions">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" className="quick-chip" onClick={() => { setInput(prompt); inputRef.current?.focus() }}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'agent' ? '🤖' : '👤'}
                </div>
                <div className="message-bubble">
                  <div className="message-content">{msg.text}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {showProducts && currentProducts.length > 0 && (
              <div className="products-carousel">
<div className="carousel-header">
                   <div className="carousel-title">
                     {locale === 'si' ? 'ලබා ගත හැකි නිෂ්පාත:' : locale === 'ta' ? 'Katchi da products:' : 'Available Products:'}
                   </div>
                   <button className="carousel-close" onClick={() => setShowProducts(false)}>✕</button>
                 </div>
                 <div className="products-grid">
                   {currentProducts.map(product => (
                     <ProductCard key={product.id || product.name} product={{...product, id: String(product.id || '')}} onAddToCart={handleAddToCart} onViewDetails={handleViewDetails} />
                   ))}
                 </div>
               </div>
             )}

            {loading && (
              <div className="message agent">
                <div className="message-avatar">🤖</div>
                <div className="message-bubble">
                  <div className="typing"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(locale, 'placeholder')}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {t(locale, 'send')}
            </button>
          </form>
        </div>
      </div>

      <Cart items={cart} isOpen={cartOpen} onClose={() => setCartOpen(false)} onRemove={handleRemoveFromCart} onCheckout={handleCheckout} locale={locale} />
      <DeliveryModal isOpen={deliveryOpen} onClose={() => setDeliveryOpen(false)} onConfirm={handleDeliveryConfirm} cart={cart} locale={locale} />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} cart={cart} deliveryInfo={deliveryInfo} onOrderCreated={handleOrderSuccess} locale={locale} />
      {lastOrder && <OrderSuccessModal isOpen={orderSuccessOpen} onClose={handleCloseSuccess} order={lastOrder} onTrack={handleTrackOrder} locale={locale} />}
    </div>
  )
}

export default App
