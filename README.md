# 💬 Real-Time Chat App met WebSockets (Socket.IO)

## Wat heb ik hier gedaan?

In dit test project heb ik een **real-time chat applicatie** gebouwd met behulp van **Node.js**, **Express** en **Socket.IO**. De app heeft chat funtie en slaat berichten op in een SQLite-database.

### 🛠️ Technologieën gebruikt

| Technologie | Doel |
|---|---|
| **Node.js** | Server-side JavaScript runtime |
| **Express** | HTTP-server en routing |
| **Socket.IO** | WebSocket communicatie (real-time) |
| **SQLite + sqlite3** | Lokale database voor berichtopslag |
| **HTML/CSS/JS** | Frontend (client-side) |

---

### 🏗️ Structuur van het project

```
websocket/
├── index.js          # Server: Express + Socket.IO logica
├── index.html        # Hoofd-chatroom (algemene chat)
├── room-anime.html   # Aparte chatroom met anime-thema
├── chat.db           # SQLite database (berichten opgeslagen)
└── .gitignore        # node_modules uitgesloten van git
```

---

### ⚙️ Functionaliteiten

#### Algemene Chatroom (`index.html`)
- ✅ Gebruikersnaam instellen via een prompt bij het openen
- ✅ Real-time berichten sturen en ontvangen
- ✅ Melding wanneer een nieuwe gebruiker de chat binnenkomt
- ✅ **"Typing indicator"** – animatie zichtbaar als iemand aan het typen is
- ✅ Weergave van online gebruikers
- ✅ **Connect / Disconnect knop** om de verbinding handmatig te verbreken of te herstellen
- ✅ Berichten worden opgeslagen in de database

#### Anime Chatroom (`/room-anime`)
- ✅ Aparte **Socket.IO room** (`room-anime`)
- ✅ Berichten worden alleen gedeeld binnen deze room
- ✅ Melding wanneer iemand de room betreedt
---

### 🗄️ Database (SQLite)

Berichten worden opgeslagen in een `messages` tabel met de volgende kolommen:

| Kolom | Type | Beschrijving |
|---|---|---|
| `id` | INTEGER | Automatisch oplopende primaire sleutel |
| `client_offset` | TEXT UNIQUE | Unieke ID per bericht (voor deduplicatie) |
| `content` | TEXT | De berichtinhoud |
| `userName` | TEXT | Naam van de afzender |

---

### 🔄 Connection State Recovery

Wanneer een client tijdelijk de verbinding verliest en opnieuw verbindt, haalt de server automatisch alle **gemiste berichten** op uit de database en stuurt deze naar de client. Dit werkt via de `serverOffset` die de client bijhoudt in `socket.auth`.

---

### 🚀 Hoe starten?

```bash
npm install
node index.js
```

Open daarna in de browser:
- **Algemene chat:** `http://localhost:3000/`
- **Anime room:** `http://localhost:3000/room-anime`

---

## 📚 Wat heb ik geleerd?

### 1.  WebSockets & Socket.IO
- Hoe WebSockets **anders werken dan normale HTTP-requests** – de verbinding blijft open voor twee-richtingscommunicatie.
- Hoe je met Socket.IO eenvoudig events kunt **emiten** (sturen) en **luisteren** aan zowel server- als clientkant.
- Het verschil tussen `socket.emit`, `socket.broadcast.emit` en `io.to(room).emit`.

### 2. Rooms (Socket.IO Rooms)
- Hoe je clients kunt **groeperen in rooms** zodat berichten alleen naar specifieke gebruikers worden gestuurd.
- Gebruik van `socket.join(room)` en `socket.to(room).emit(...)`.

### 3. Acknowledgements (Callbacks)
- Hoe je een **bevestiging (acknowledgement)** kunt terugsturen van de server naar de client na het verwerken van een event.
- Waarom dit belangrijk is: zonder callback blijft de client wachten en probeert hij het opnieuw (retry-mechanisme).


### 4. Connection State Recovery
- Hoe je zorgt dat clients **gemiste berichten** ontvangen na een herverbinding via de `serverOffset`.
- Gebruik van `socket.handshake.auth` om data van de client te lezen bij verbinding.

### 5. Frontend WebSocket Client
- Hoe de **Socket.IO client-library** werkt in de browser.
- Events sturen en ontvangen vanuit HTML/JavaScript.
- Dynamisch de DOM updaten op basis van ontvangen berichten.


> 📝 *Dit project is gemaakt als leerproject voor Semester 7 aan Fontys Hogeschool.*

