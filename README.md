# 🦙 Llama Chat Proxy - Advanced AI Workflow Platform

![Llama Chat Banner](https://via.placeholder.com/1200x400?text=Llama+Chat+Proxy+Platform)

A production-ready, collaborative AI chat interface designed for power users. Llama Chat Proxy integrates structured workflows, prompt engineering tools, and real-time collaboration into a single, sleek application.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Running Locally](#-running-locally)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 1. 🎨 Unified Composer Interface
A powerful input area that combines multiple modalities:
- **Multi-modal Input:** Text, Voice (Speech-to-Text), and File Uploads (PDF/Text).
- **Smart Toolbar:** Quick access to Prompts, Optimization, and Regeneration.
- **Auto-Expanding:** Distraction-free writing experience.

### 2. ⚡ Workflow Builder
Transform complex tasks into guided, step-by-step processes.
- **Pre-built Templates:** Job Search, Content Writing, Code Development, Email Strategy.
- **Interactive Steps:** Execute prompts sequentially, with context from previous steps passed forward.
- **Rich Results:** Markdown-formatted outputs with expand/collapse capability.

### 3. 🪄 Prompt Optimizer
AI-powered assistant to refine your prompts before sending.
- **Analysis:** Detects issues like brevity, lack of context, or weak instructions.
- **Suggestions:** Generates 3 optimized variations (e.g., "More Creative", "More Professional").
- **One-Click Apply:** Instantly use the best version.

### 4. 📚 Context-Aware Prompt Library
- **Dynamic Suggestions:** Shows prompts relevant to the current chat category (e.g., Coding prompts for "Code Writer" mode).
- **Quick Access:** accessible via a popover menu in the composer.

### 5. � Real-Time Collaboration
- **Rooms:** Create or join named rooms to chat with others.
- **Live Sync:** Messages update in real-time across all connected clients.

### 6. 🛠️ Category-Specific Tools
- **Right Sidebar:** specialized tools based on the active chat mode (e.g., SEO keywords for Writing, Code snippets for Coding).

---

## 💻 Tech Stack

### Frontend
- **Framework:** [React](https://reactjs.org/) (Vite)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** Custom Hooks & Context API
- **PDF Processing:** PDF.js

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **AI Integration:** OpenAI-compatible API Proxy (works with Llama, Groq, OpenAI)
- **Real-time:** Polling / WebSocket ready architecture

---

## � Project Structure

```bash
llama-chat-proxy/
├── client/                 # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── components/     # UI Components
│   │   │   ├── Composer.jsx        # Main input area
│   │   │   ├── WorkflowBuilder.jsx # Workflow logic
│   │   │   ├── PromptOptimizer.jsx # AI optimization modal
│   │   │   ├── Sidebar.jsx         # Navigation & Rooms
│   │   │   └── ...
│   │   ├── state/          # Global State (ChatStore)
│   │   ├── utils/          # Helper functions
│   │   ├── App.jsx         # Main App Component
│   │   └── styles.css      # Global Styles & Tailwind directives
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server.js               # Backend Express Server
├── package.json            # Root dependencies (concurrently)
└── .env                    # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- An API Key for your AI Provider (e.g., Groq, OpenAI, Together AI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/llama-chat-proxy.git
    cd llama-chat-proxy
    ```

2.  **Install Root Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Client Dependencies:**
    ```bash
    cd client
    npm install
    cd ..
    ```

### Environment Setup

1.  Create a `.env` file in the root directory:
    ```bash
    cp .env.example .env
    ```

2.  Add your API configuration to `.env`:
    ```env
    PORT=3001
    # Example for Groq (Llama 3)
    AI_API_URL=https://api.groq.com/openai/v1/chat/completions
    AI_API_KEY=your_api_key_here
    AI_MODEL=llama3-70b-8192
    ```

---

## ▶️ Running Locally

To run both the backend server and the frontend client simultaneously:

```bash
# From the root directory
npm start
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:3001](http://localhost:3001)

*Note: The project uses `concurrently` to run both processes in a single terminal window.*

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)
1.  Push your code to GitHub.
2.  Import the `client` directory as the root of your project in Vercel/Netlify.
3.  Set the Build Command to `npm run build`.
4.  Set the Output Directory to `dist`.
5.  **Important:** You will need to update the API endpoint in the frontend code to point to your deployed backend URL instead of `localhost:3001`.

### Backend (Render/Railway/Heroku)
1.  Push your code to GitHub.
2.  Deploy the root directory.
3.  Set the Build Command to `npm install`.
4.  Set the Start Command to `node server.js`.
5.  Add your environment variables (`AI_API_KEY`, etc.) in the platform's dashboard.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## � License

Distributed under the MIT License. See `LICENSE` for more information.
