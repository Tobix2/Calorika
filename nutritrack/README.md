#  NutriTrack: AI-Powered Nutrition Tracker

NutriTrack es una aplicación web moderna construida con Next.js y Firebase, diseñada para ayudarte a registrar tu ingesta de alimentos, hacer un seguimiento de tus calorías y alcanzar tus objetivos de fitness con la ayuda de recomendaciones personalizadas de una IA.

## Tecnologías Principales

- **Framework:** [Next.js](https://nextjs.org/) (con App Router)
- **Base de Datos y Autenticación:** [Firebase](https://firebase.google.com/) (Firestore y Authentication)
- **Funcionalidad IA:** [Google AI (Genkit)](https://firebase.google.com/docs/genkit)
- **UI:** [ShadCN UI](https://ui.shadcn.com/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)

## Prerrequisitos

Asegúrate de tener instalada una versión reciente de Node.js en tu sistema.
- **Node.js:** v18.17.0 o superior.

Puedes descargar Node.js desde [nodejs.org](https://nodejs.org/).

## Guía de Instalación

Sigue estos pasos para poner en marcha el proyecto en tu entorno de desarrollo local.

### 1. Clona el Repositorio

Primero, clona este repositorio en tu máquina local.
```bash
git clone <URL_DEL_REPOSITORIO>
cd nutritrack
```

### 2. Instala las Dependencias

Utiliza tu gestor de paquetes preferido para instalar todas las dependencias del proyecto.

```bash
npm install
# O si usas yarn:
# yarn install
# O si usas pnpm:
# pnpm install
```

### 3. Configura las Variables de Entorno

Este proyecto requiere dos conjuntos de credenciales de Firebase para funcionar correctamente: una para el cliente (navegador) y otra para el servidor (Firebase Admin SDK).

#### a) Configuración del Cliente

1.  Ve a tu **Consola de Firebase**, selecciona tu proyecto.
2.  En la configuración del proyecto (icono de engranaje), busca la sección "Tus apps".
3.  En "Configuración de Firebase SDK", selecciona "Configuración" y copia el objeto de configuración.
4.  Pega este objeto en el archivo `src/lib/firebase.ts`, reemplazando el `firebaseConfig` existente.

El archivo debería verse así:
```typescript
// src/lib/firebase.ts
import {initializeApp, getApp, getApps} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import { getAuth } from "firebase/auth";

// ❗️ TU CONFIGURACIÓN DE FIREBASE VA AQUÍ
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// ... resto del archivo
```

#### b) Configuración del Servidor (Firebase Admin)

1.  En la **Consola de Firebase**, ve a "Configuración del proyecto" > "Cuentas de servicio".
2.  Haz clic en "Generar nueva clave privada". Se descargará un archivo JSON.
3.  Crea un archivo llamado `.env` en la raíz de tu proyecto.
4.  Abre el archivo JSON que descargaste, cópialo y pégalo como una sola línea en tu archivo `.env`. La clave debe ser `FIREBASE_SERVICE_ACCOUNT`.

Tu archivo `.env` debe tener el siguiente formato:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```
**Importante:** El archivo `.gitignore` ya está configurado para ignorar los archivos `.env`, por lo que tus credenciales permanecerán seguras y no se subirán al repositorio.

### 4. Ejecuta el Servidor de Desarrollo

Una vez que las dependencias estén instaladas y las variables de entorno configuradas, puedes iniciar el servidor de desarrollo.

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en funcionamiento.

---

¡Y eso es todo! Ahora tienes una copia de NutriTrack funcionando localmente. ¡Feliz codificación!
