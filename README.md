## 📌 Overview

# Maths Table UI is an Android‑style, touch‑friendly web application to generate multiplication tables.

- **Finite mode (Backend):** Sends `POST /api/table` to a MuleSoft endpoint via a Node/Express proxy and renders the full JSON result.
- **Infinite mode (Client):** When enabled and **End** is left blank (or `∞`), the UI streams lines forever from the **Start** value—no backend call—great for demos and stress‑free exploration.

### ✨ Key Features
- Android‑like **numeric keypad** (supports `-` and `.`)
- **Negative numbers** supported for Number/Start/End
- **Infinite mode** (client) with **Start/Stop** toggle
- **Finite mode** via Node proxy → MuleSoft CloudHub (`/api/table`)
- **Copy** to clipboard & **Download** (JSON/TXT)
- **History** (last 50) with one‑tap **Re‑run**
- **Haptic feedback** & **click sound** (toggles in Settings)
- Clean **bottom navigation** & clickable watermark `#CreatedByNarsing-s`

### 🛠 Endpoints (Server)
- `POST /api/table` – finite mode (proxy → Mule); body: `{ "num": <number>, "str": <int>, "end": <int> }`

> **Notes:**  
> • For finite mode, `str` and `end` must be integers and `str <= end` (matches Mule range logic).  
> • For infinite mode, enable it in **Settings**, leave **End** empty (or type `∞`), then press **Start Infinite**.

``
