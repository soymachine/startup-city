# 🏙️ Startup City

Portfolio de startups en formato ciudad pixel art isométrica. Gestiona tus ideas de negocio de forma visual — cada startup es un edificio que crece conforme el proyecto evoluciona.

## Stack

- **Phaser 3** — motor isométrico
- **React 18** — UI (login, sidebar, formularios)
- **Vite** — build tool
- **Tailwind CSS** — estilos
- **Firebase Auth + Firestore** — auth y datos en tiempo real
- **GitHub Pages + Actions** — deploy automático

## Setup local

### 1. Clonar y instalar

```bash
git clone https://github.com/soymachine/startup-city
cd startup-city
npm install
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activa **Authentication → Email/Password**
3. Crea los dos usuarios (Dani y su hermano)
4. Activa **Firestore Database**
5. Copia las reglas de `firestore.rules` a la consola de Firebase

### 3. Variables de entorno

```bash
cp .env.example .env.local
# Rellena los valores de tu proyecto Firebase
```

### 4. Ejecutar en local

```bash
npm run dev
```

## Deploy a GitHub Pages

El deploy es automático con cada push a `main` via GitHub Actions.

Antes de hacer el primer deploy, añade los secretos de Firebase en:
**GitHub repo → Settings → Secrets and variables → Actions**

Secretos necesarios:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Niveles de startup

| Nivel | Estado | Edificio |
|---|---|---|
| 0 | 💡 Idea embrionaria | Solar con cartel |
| 1 | 📝 Definiendo | Caseta de obra |
| 2 | 🔧 Prototipo | Edificio pequeño |
| 3 | 🔒 Beta privada | Edificio acabado |
| 4 | 🌍 Beta pública | Edificio corporativo |
| 5 | 📈 Tracción | Torre con neón |
| 6 | 🚀 Scale-up | Rascacielos |
