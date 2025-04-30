# AI Study Assistant Chrome Extension

A Chrome extension that helps you analyze quiz questions and suggests the most likely correct answer using OpenAI's GPT models.

---

## Features

- Extracts quiz questions from Canvas and similar platforms.
- Uses OpenAI's GPT-4 (or GPT-3.5) to analyze and answer questions.
- Minimal, hidden UI: only a small "A" button appears until you open the assistant.
- Adjustable delay between questions to avoid API rate limits.
- Supports your own OpenAI API key.

---

## Installation

1. **Clone or Download the Repository**
   - Download this folder to your computer.

2. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser.

3. **Enable Developer Mode**
   - Toggle the switch in the top right corner.

4. **Load Unpacked Extension**
   - Click "Load unpacked".
   - Select the folder you downloaded (the one containing `manifest.json`).

---

## Setup

1. **Open the Extension Popup**
   - Click the extension icon in your Chrome toolbar.

2. **Enter Your OpenAI API Key**
   - Paste your OpenAI API key (starts with `sk-...`) in the field provided.

3. **(Optional) Advanced Options**
   - Click "+ Advanced Options" to:
     - Select the AI model (GPT-4 recommended for best accuracy).
     - Adjust the delay between questions (increase if you get rate limited).

4. **Enable the Assistant**
   - Toggle "Enable Assistant" to ON.
   - Click "Save Settings".

---

## Usage

1. **Go to Your Quiz Page**
   - Navigate to a Canvas quiz or similar page.

2. **Open the Assistant**
   - Click the small green "A" button in the bottom right corner.

3. **Analyze Quiz**
   - Click "Analyze Quiz" in the assistant popup.
   - Wait for the assistant to process and display answers.

4. **Hide/Minimize**
   - Use the "Hide" button to re-hide the assistant.
   - Use the "−# AI Study Assistant Chrome Extension
