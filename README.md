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

## How to Deploy to IPFS (via 4EVERLAND)

**Recommended Method**

We use **4EVERLAND** to deploy to the decentralized network (IPFS). It works just like Vercel but for Web3.

1. **Push Code to GitHub**:
   - Upload your code files to a GitHub repository.

2. **Login to 4EVERLAND**:
   - Go to [https://www.4everland.org/](https://www.4everland.org/)
   - Click "Login" and select **"Login with GitHub"**.

3. **Create Project**:
   - Click **"+ New Project"**.
   - Select your GitHub repository (`DeChat` or whatever you named it).

4. **Configure Build**:
   - **Framework**: It should auto-detect "Vite", or select it manually.
   - **Root Directory**: `./`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Platform**: Ensure **IPFS** is selected.

5. **Environment Variables (Crucial)**:
   - Find the "Environment Variables" section in the setup page.
   - Key: `API_KEY`
   - Value: `Your_Google_Gemini_API_Key`

6. **Deploy**:
   - Click **"Deploy"**.

Wait about 2 minutes. Once finished, 4EVERLAND will give you:
- A generic domain (e.g., `dechat.4everland.app`).
- An **IPFS Hash (CID)**. You can verify this is decentralized by putting the CID into any IPFS gateway.

**Note for TP Wallet**:
Copy the generated URL (or the IPFS link) and paste it into the DApp browser inside TokenPocket/MetaMask to use.
