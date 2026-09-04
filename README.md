# NE-SHIELD Crowd Reporter PWA 🛡️

A mobile-first, offline-first Progressive Web App (PWA) built with **Next.js 14**, **MongoDB Atlas**, **ImageKit**, and **IndexedDB** for crowd-sourced disaster and hazard reporting across Northeast India.

---

## 🎨 Features & Visual Identity
- **Premium Green & White Aesthetic**: Clean, modern fintech/emergency response UI built for maximum visibility and accessibility.
- **Offline-First Architecture**: Powered by IndexedDB (`idb`) to capture reports and photos in remote/disconnected areas. Background synchronization automatically pushes data to MongoDB Atlas once connection is restored.
- **ImageKit Direct Photo Uploads**: Secure HMAC token signature flow for instant client-side photo evidence uploads.
- **GPS Satellite Location Capture**: High-precision latitude, longitude, and accuracy capture.
- **Standalone Runtime & External API**: Fully decoupled from external backends, featuring protected `/api/v1/external/*` endpoints for administrative GIS dashboards.

---

## 🚀 Environment Variables (`.env.local`)

Copy `.env.example` to `.env.local`:

```env
MONGODB_URI=mongodb+srv://nareshchoudhary6482_db_user:jet6N73fJSBOKoXU@cluster0.44qcisa.mongodb.net/ne_shield_db?retryWrites=true&w=majority
IMAGEKIT_PUBLIC_KEY=public_dYzVWPCwGq51pf6L1UAyd4Im3dw=
IMAGEKIT_PRIVATE_KEY=private_q3Wn6qmRyp4GuI/vx5eVLXcHmEs=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/v08bk6kth
EXTERNAL_API_KEY=ne_shield_secret_key_2026
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🛠️ Local Development & Deployment

### Run Locally:
```bash
npm install
npm run dev
```
Access app at `http://localhost:3000`.

### Production Build:
```bash
npm run build
npm run start
```

### Deploy to Vercel / Netlify:
1. Connect this repository to **Vercel** or **Netlify**.
2. Add the environment variables specified in `.env.example`.
3. Set build command: `npm run build` and publish directory: `.next`.

---

## 📱 License
Distributed under the MIT License for NE-SHIELD Emergency Response Project.
