**CPQ Quote Intelligence Agent**
A Chrome extension that sits on top of Salesforce CPQ and gives sales reps an AI-powered quote review — without any changes to the org.

**The Problem**
Sales reps working on CPQ quotes have to manually cross-check pricing rules, discount policies, and bundle configurations before sending for approval. This is slow, error-prone, and creates back-and-forth with deal desk.

**The Solution**
One click on the extension icon while on a Quote record gives the rep:
1. Configuration flags — missing bundle components, pricing mismatches, policy violations
2. Discount recommendation — suggested discount with floor and ceiling based on the deal context
3. Approval justification — a ready-to-copy note structured for deal desk review

Everything happens inside Salesforce. The rep never leaves the page.

**Tech Stack**
Layer                            Technology
Browser Extension              Chrome Extension
Salesforce Integration         REST API using active session
Backend                        Node.js + Express
AI                              Anthropic Claude API

**How It Works**
The extension reads the Quote ID from the URL, pulls relevant data from Salesforce using the rep's own session, sends it to a lightweight backend, and gets back structured analysis from Claude.
The Anthropic API key lives only on the backend server. It is never exposed to the browser.

**Project Structure**
cpq-agent/
├── extension/        ← Chrome extension
└── backend/          ← Node.js API server

**Local Setup**
_# Install dependencies_
cd backend
npm install

_# Add your environment variables_
cp .env.example .env

_# Start the backend_
node index.js

_# Load the /extension folder as an unpacked extension in chrome://extensions_
