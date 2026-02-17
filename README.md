# ThrowMyFile 🚀

[https://throwmyfile.com/](https://throwmyfile.com/)

ThrowMyFile is a lightweight, high-performance, and privacy-focused **P2P (Peer-to-Peer)** file sharing application. It allows you to move files across the globe instantly without ever storing them on a server.

## ✨ Features

- **Pure P2P Transfer**: Files move directly from the sender's device to the recipient's device.
- **Privacy First**: No databases, no tracking, and no intermediate storage of your files.
- **Multiple File Support**: Select and transfer multiple files simultaneously.
- **Automatic Compression**: Automatically zips multiple files for faster transfers.
- **Real-time Feedback**: Live progress bars and transfer status updates.
- **Modern Dark UI**: A sleek, minimal, and fully responsive glassmorphism design.
- **Open Source**: Built with transparency and community contribution in mind.

## 🛠️ Tech Stack

### Backend
- **TypeScript**: Ensuring robust and type-safe code.
- **Node.js & Express**: Lightweight and fast server handling.
- **Socket.io**: Powering real-time P2P coordination.
- **Socketio-file-upload**: Optimized file streaming.

### Frontend
- **React**: Modern component-based UI.
- **Ant Design**: Polished and professional UI components.
- **Styled Components**: Scoped and clean CSS-in-JS styling.
- **React Spring**: Fluid and beautiful animations.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jamg26/throw-files.git
   cd throw-files
   ```

2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   ```

### Running Locally

1. **Start the Backend:**
   From the root directory:
   ```bash
   npm run server
   ```

2. **Start the Frontend:**
   From the `client` directory:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 🌍 Deployment

This project is optimized for deployment on **Render** (or similar platforms like Heroku/Vercel).

- **Build Command**: `npm run build`
- **Start Command**: `npm start`

Ensure you set the `FE_URL` environment variable to your public frontend URL.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
Developed with ❤️ by [Jamuel Galicia](https://github.com/jamg26)
