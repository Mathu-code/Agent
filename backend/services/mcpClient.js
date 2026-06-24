import axios from 'axios'

const MCP_ENDPOINT = 'https://mcp.kapruka.com/mcp'

// Initialize MCP client with axios
const mcpClient = axios.create({
  baseURL: MCP_ENDPOINT,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Search products in Kapruka catalog
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {string} params.category - Category name (optional)
 * @param {number} params.min_price - Minimum price (optional)
 * @param {number} params.max_price - Maximum price (optional)
 * @param {boolean} params.in_stock_only - Show only in stock items (optional)
 * @param {string} params.sort - Sort order: "name", "price_asc", "price_desc", "newest" (optional)
 * @param {number} params.limit - Results per page, max 50 (optional)
 * @param {string} params.cursor - Pagination cursor (optional)
 * @param {string} params.currency - Currency: "LKR", "USD", "EUR" (optional)
 * @returns {Promise} Search results
 */
export const searchProducts = async (params) => {
  try {
    const queryParams = {
      q: params.q || '',
      ...params
    }
    
    const response = await mcpClient.get('/tools/kapruka_search_products', {
      params: queryParams
    })
    
    return response.data
  } catch (error) {
    console.error('MCP Search error:', error.message)
    throw new Error(`Failed to search products: ${error.message}`)
  }
}

/**
 * Get full product details by ID
 * @param {string} productId - Product ID
 * @param {string} currency - Currency code (optional)
 * @returns {Promise} Product details
 */
export const getProduct = async (productId, currency = 'LKR') => {
  try {
    const response = await mcpClient.get('/tools/kapruka_get_product', {
      params: {
        product_id: productId,
        currency
      }
    })
    
    return response.data
  } catch (error) {
    console.error('MCP Get Product error:', error.message)
    throw new Error(`Failed to fetch product: ${error.message}`)
  }
}

/**
 * List all product categories
 * @param {number} depth - Category depth (optional)
 * @returns {Promise} Categories list
 */
export const listCategories = async (depth = 1) => {
  try {
    const response = await mcpClient.get('/tools/kapruka_list_categories', {
      params: { depth }
    })
    
    return response.data
  } catch (error) {
    console.error('MCP List Categories error:', error.message)
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }
}

/**
 * Search delivery cities
 * @param {string} query - City name or alias
 * @param {number} limit - Max results
 * @returns {Promise} Matching cities
 */
export const listDeliveryCities = async (query, limit = 20) => {
  try {
    const response = await mcpClient.get('/tools/kapruka_list_delivery_cities', {
      params: {
        query,
        limit
      }
    })
    
    return response.data
  } catch (error) {
    console.error('MCP List Cities error:', error.message)
    throw new Error(`Failed to fetch cities: ${error.message}`)
  }
}

/**
 * Check if delivery is available for a product to a city on a date
 * @param {string} city - Delivery city
 * @param {string} deliveryDate - Delivery date (YYYY-MM-DD format)
 * @param {string} productId - Product ID
 * @returns {Promise} Delivery availability and rate
 */
export const checkDelivery = async (city, deliveryDate, productId) => {
  try {
    const response = await mcpClient.get('/tools/kapruka_check_delivery', {
      params: {
        city,
        delivery_date: deliveryDate,
        product_id: productId
      }
    })
    
    return response.data
  } catch (error) {
    console.error('MCP Check Delivery error:', error.message)
    throw new Error(`Failed to check delivery: ${error.message}`)
  }
}

/**
 * Create a guest checkout order
 * @param {Object} orderData - Order details
 * @param {Array} orderData.cart - Array of cart items [{product_id, quantity}]
 * @param {Object} orderData.recipient - {name, email, phone, city}
 * @param {Object} orderData.delivery - {city, date}
 * @param {Object} orderData.sender - {name, email, phone} (optional)
 * @param {string} orderData.giftMessage - Gift message (optional)
 * @param {string} orderData.currency - Currency code (optional)
 * @returns {Promise} Order confirmation with pay link
 */
export const createOrder = async (orderData) => {
  try {
    const response = await mcpClient.post('/tools/kapruka_create_order', {
      cart: orderData.cart,
      recipient: orderData.recipient,
      delivery: orderData.delivery,
      sender: orderData.sender || null,
      gift_message: orderData.giftMessage || null,
      currency: orderData.currency || 'LKR'
    })
    
    return response.data
  } catch (error) {
    console.error('MCP Create Order error:', error.message)
    throw new Error(`Failed to create order: ${error.message}`)
  }
}

/**
 * Track an existing order
 * @param {string} orderNumber - Order number
 * @returns {Promise} Order details and tracking info
 */
export const trackOrder = async (orderNumber) => {
  try {
    const response = await mcpClient.get('/tools/kapruka_track_order', {
      params: {
        order_number: orderNumber
      }
    })
    
    return response.data
  } catch (error) {
    console.error('MCP Track Order error:', error.message)
    throw new Error(`Failed to track order: ${error.message}`)
  }
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
