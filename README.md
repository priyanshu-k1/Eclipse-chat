<!-- Banner Image Placeholder -->
<p align="center">
  <img src="https://priyanshu-k1.github.io/Portfolio_Priyanshu/res/Eclipse-chat.png" alt="Eclipse Chat Banner" width="100%" />
</p>

<h1 align="center">🌙 Eclipse Chat</h1>
<p align="center">Stay Private, Stay Connected – A privacy-first, modern messaging app.</p>

---

## Overview
**Eclipse Chat** is a highly privacy-oriented messaging platform built for modern communication.  
It focuses on **end-to-end encryption**, **ephemeral messages**, and **zero-tracking policies**, giving you complete control over your conversations.  

---

## Features
- **End-to-End Encryption 256** – every message is secure by default.  
- **Ephemeral Messaging** – chats vanish after reading, unless both users consent to save.  
- **Anti-Screenshot & Secure Media** – media stored in special encrypted format.  
- **Consent-Driven Saving** – both sender and receiver must agree before saving.  
- **No Ads. No Tracking. Zero Metadata Logging.**  
- **Username-Based User Discovery** – no phone number required.  

---

## Tech Stack
**Frontend:** React, Flutter (Dart/Kotlin for mobile)  
**Backend:** Node.js, Express.js, Socket.IO  
**Database:** MongoDB (Atlas)  
**Encryption:** Node Crypto (AES-256-GCM)  
**Authentication:** JWT + bcrypt  

---

## Project Structure
```bash
Eclipse-chat/
│
├── backend/            # Node.js + Express server
│   ├── config/         # Database & app config
│   ├── controllers/    # Auth & messaging logic
│   ├── middleware/     # Custom middlewares
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── micro-service/  # Encryption & extra services
│   ├── server.js       # Entry point
│   └── app.js          # App setup
│
├── frontend/           # React (landing page, web app)
│
└── README.md
