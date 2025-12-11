# DeChat P2P

A fully decentralized, serverless, end-to-end encrypted chat and video calling DApp.

## Features

- **No Servers**: Uses PeerJS for P2P WebRTC signaling.
- **Hosting**: IPFS (InterPlanetary File System).
- **Wallet Login**: Supports MetaMask/TokenPocket.
- **Test Mode**: Built-in generic BSC wallet generator.
- **AI Integration**: Gemini AI.

## How to Run Locally

1. Install Node.js.
2. Install dependencies: `npm install`
3. Create `.env` file with `API_KEY=your_gemini_key`
4. Start server: `npm run dev`

## How to Deploy to IPFS (via Fleek)

**This is the recommended method for decentralized deployment.**

1. **Push Code**: Push this repository to your GitHub.
2. **Fleek Account**: Go to [Fleek.xyz](https://fleek.xyz) and login with GitHub.
3. **New Site**: Click "Add New Site" -> "Import from Git".
4. **Settings**:
   - Framework: **Vite**
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
5. **Environment Variables**:
   - In Fleek settings, add a variable named `API_KEY` and paste your Google Gemini API Key.
6. **Deploy**: Click "Deploy Site".

Once finished, Fleek will provide:
1. A generic URL (e.g., `your-app.on-fleek.app`).
2. An **IPFS CID** (Content Identifier). This is your decentralized address.
