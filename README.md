# VocaBuddy - Personal Vocabulary Trainer

VocaBuddy is a modern, responsive, and offline-capable Progressive Web Application (PWA) designed to help language learners efficiently build and review their vocabulary. Built with React, Vite, and backed by a free Google Apps Script (GAS) + Google Sheets database structure, it serves as a full-stack vocabulary management and spaced-repetition study tool.

## 🚀 Live Demo
[VocaBuddy Live App](https://mimi2158891.github.io/VocaBuddy-/)

## ✨ Key Features
- **Progressive Web App (PWA)**: Installable on Desktop/Mobile, offline-capable (read-only mode), and fast load times with service worker caching.
- **Serverless Backend (Google Sheets)**: 100% free cloud database using Google Apps Script.
- **Advanced Spaced Repetition System (SRS)**: SM-2 based algorithm for scientifically timed vocabulary review.
- **Multi-Sheet Folder Organization**: Categorize vocabulary into multiple discrete folders (Sheets).
- **Interactive Flashcards**: Flip-card UI with options to randomize, loop, and auto-play vocabulary with TTS.
- **Text-to-Speech (TTS)**: Built-in Web Speech API integration with accent selection and adjustable speed.
- **Bulk CSV Import**: Drag-and-drop CSV imports to quickly populate new vocabulary folders.
- **Optimized Performance**: True optimistic UI updates, localStorage caching, and fire-and-forget API requests.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, React Router, CSS Variables (Custom Design System).
- **Backend / DB**: Google Apps Script (REST API), Google Sheets.
- **Deployment**: GitHub Actions (CI/CD), GitHub Pages.
- **Offline / Caching**: Vite PWA Plugin, Workbox.

## 📦 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mimi2158891/VocaBuddy-.git
   cd VocaBuddy-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Google Apps Script Web App URL:
   ```env
   VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_GAS_ID/exec
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
