# VocaBuddy - Personal Vocabulary Trainer

VocaBuddy is a modern, responsive, and offline-capable Progressive Web Application (PWA) designed to help language learners efficiently build and review their vocabulary.

## 🚀 Live Demo
[VocaBuddy Live App](https://mimi2158891.github.io/VocaBuddy-/)

## ✨ Key Features
- **PWA Ready**: Installable on Desktop/Mobile with offline support via `vite-plugin-pwa`.
- **Serverless Backend**: Uses Google Apps Script + Google Sheets as a free database.
- **Shared State**: Centralized state management using React Context API.
- **Text-to-Speech (TTS)**: Multi-accent support with adjustable speed.
- **CSV Import**: Easily migrate your vocabulary from CSV files.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, React Router, Context API.
- **PWA**: `vite-plugin-pwa`.
- **Backend**: Google Apps Script (REST API).
- **Deployment**: GitHub Pages.

## 🌍 Deployment (GitHub Pages)

### 1. GitHub Secrets Setup (Required)
To make the API work in production, you **MUST** add your Google Apps Script URL as a secret:
1. Go to your GitHub Repo > **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Name: `VITE_GAS_API_URL`.
4. Value: `https://script.google.com/macros/s/.../exec`.

### 2. Google Apps Script Setup
1. Open your GAS project.
2. Click **Deploy** > **New deployment**.
3. Select **Web App**.
4. Set "Who has access" to **Anyone**.

## 📦 Local Development

1. **Clone & Install:**
   ```bash
   git clone https://github.com/mimi2158891/VocaBuddy-.git
   cd VocaBuddy-
   npm install
   ```

2. **Set up Environment Variables:**
   Create a `.env` file in the root:
   ```env
   VITE_GAS_API_URL=你的_GAS_網址
   ```

3. **Run Locally:**
   ```bash
   npm run dev
   ```

## 🔒 Security & Maintenance

### Environment Variables
**DO NOT** commit your `.env` file to the repository. It is already included in `.gitignore`.

### Rotating API Keys (GAS)
If your Google Apps Script Web App URL is leaked:
1. Open your GAS project.
2. Click **Deploy** > **Manage deployments**.
3. Create a **New deployment** or Archive the old one to change the URL.
4. Update your `.env` file and GitHub Secrets if applicable.

### Cleaning Git History
If you accidentally pushed sensitive data:
```bash
# Force remove .env from history using BFG Repo-Cleaner or git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```
