# Kapruka Shopping Agent 🛍️

A full-stack AI shopping agent built for the Kapruka Agent Challenge 2026.

## Project Structure

```
Agent/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── main.js       # Entry point
│   │   ├── App.jsx       # Main App component
│   │   ├── App.css       # Component styling
│   │   └── index.css     # Global styles
│   ├── index.html        # HTML template
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Frontend dependencies
│
├── backend/              # Node.js + Express server
│   ├── server.js         # Main server file
│   ├── .env.example      # Environment variables template
│   └── package.json      # Backend dependencies
│
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Quick Start

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend will run on `http://localhost:3000`

## Architecture

- **Frontend**: Vite + React for a fast, modern chat UI
- **Backend**: Node.js + Express as the API server
- **Communication**: REST API between frontend and backend
- **MCP Integration**: Backend will call Kapruka MCP for all e-commerce operations

## Main Files

| File                   | Purpose                           |
| ---------------------- | --------------------------------- |
| `frontend/src/main.js` | React app entry point             |
| `frontend/src/App.jsx` | Main chat interface component     |
| `backend/server.js`    | Express server with all endpoints |

## Available Endpoints

### Chat API

- `POST /chat` - Send a message to the agent

### Product Endpoints

- `POST /search-products` - Search products (Kapruka MCP integration)
- `GET /product/:productId` - Get product details
- `GET /categories` - List product categories

### Delivery Endpoints

- `POST /check-delivery` - Check delivery availability

### Order Endpoints

- `POST /create-order` - Create a guest checkout order
- `GET /track-order/:orderNumber` - Track an order

## Environment Variables

Backend requires a `.env` file (copy from `.env.example`):

```
PORT=3000
NODE_ENV=development
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp
```

## Development

Both frontend and backend support hot reload:

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && npm run dev
```

## Next Steps

1. Install dependencies for both frontend and backend
2. Run both dev servers
3. Integrate Kapruka MCP endpoints in `backend/server.js`
4. Add shopping cart state management to frontend
5. Build the product cards and checkout flow
6. Deploy to production (Vercel for frontend, suitable Node.js host for backend)

## Challenge Information

- **MCP Endpoint**: `https://mcp.kapruka.com/mcp`
- **Deadline**: 30 June 2026
- **Main Goals**: Full-screen chat UI, visual product cards, delivery checking, guest checkout

---

Built for the Kapruka Agent Challenge 2026 🏆
