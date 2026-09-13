# App Peña

App web para gestionar la convocatoria semanal de la peña: quién juega, invitados,
sorteo de encargados, resultado del partido, cerveza postpartido y clasificación de
la temporada. Sin cuentas de usuario: cada peñista elige su nombre de una lista.

Construida con React + Vite y Firebase (Firestore + Auth anónima), pensada para
desplegarse gratis en GitHub Pages.

## Puesta en marcha (desarrollo)

```bash
npm install
```

Para desarrollar **sin** un proyecto Firebase real, usando los emuladores locales
(recomendado para trastear con la app):

```bash
cp .env.example .env
# deja VITE_USE_EMULATOR=true y el resto de VITE_FIREBASE_* vacío
npm run emuladores   # terminal 1: arranca Auth + Firestore emulados
npm run dev          # terminal 2: arranca la app
```

Los datos de los emuladores se pierden al pararlos (no hay persistencia entre
sesiones salvo que se use `--export-on-exit`).

## Configurar tu proyecto Firebase real

1. Crea un proyecto en <https://console.firebase.google.com> (plan gratuito Spark
   es suficiente).
2. Dentro del proyecto, activa **Firestore Database** (modo producción) y, en
   **Authentication → Sign-in method**, activa el proveedor **Anónimo**.
3. En **Configuración del proyecto → Tus apps**, crea una app web y copia sus
   claves.
4. Copia `.env.example` a `.env` y rellena `VITE_FIREBASE_*` con esas claves
   (deja `VITE_USE_EMULATOR=false` o bórralo).
5. Despliega las reglas de seguridad (`firestore.rules`) a tu proyecto:

   ```bash
   firebase login
   firebase use --add          # elige tu proyecto real
   firebase deploy --only firestore:rules
   ```

Al abrir la app por primera vez contra un proyecto nuevo, se crea automáticamente
el documento `config/general` con nombre de peña **"Mi Peña"** y PIN de admin
**1234**. Entra en la pestaña **Admin** con ese PIN y, desde **Ajustes**, cambia el
nombre de la peña y el PIN; desde **Peñistas**, da de alta a la plantilla real.

## Desplegar en GitHub Pages

1. Crea un repositorio en GitHub (puede ser este mismo proyecto) y súbelo:

   ```bash
   git init
   git add .
   git commit -m "App Peña inicial"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/<nombre-repo>.git
   git push -u origin main
   ```

2. En `.env`, pon `VITE_BASE_PATH=/<nombre-repo>/` (tiene que coincidir con el
   nombre del repositorio).
3. Publica:

   ```bash
   npm run deploy
   ```

   Esto construye la app y la sube a la rama `gh-pages` con el paquete `gh-pages`.
4. En GitHub → Settings → Pages, selecciona como origen la rama `gh-pages`. La
   app quedará accesible en `https://<tu-usuario>.github.io/<nombre-repo>/`.

## Reglas de negocio implementadas

- **Convocatoria activa**: siempre la del próximo lunes; si hoy es lunes y aún no
  son las 21:00, es la de hoy. No hay cierre automático antes de esa hora.
- **Aforo**: mínimo 14, máximo 16. Los peñistas que dicen "juego" tienen prioridad
  por orden de apunte; si son más de 16, los últimos quedan en lista de espera.
  Los invitados **nunca** se añaden solos: el admin decide a quién confirma
  (pestaña Admin → Convocatoria → "Completar aforo con invitados"), respetando el
  orden de apunte como guía.
- **Puntos**: victoria 3, empate 2, derrota 1, no jugar 0. Cerveza postpartido +0,5
  (acumulable). Los invitados no puntúan ni salen en la clasificación.
- **Encargados**: el admin sortea 2 peñistas entre los confirmados para jugar ese
  día (nunca invitados); se puede repetir el sorteo.
- **Fotos de perfil**: cualquier peñista puede subir o cambiar la foto de
  cualquiera (no hay contraseñas, ver "Seguridad" más abajo) tocando su
  avatar en la barra superior. Se guardan como imagen pequeña incrustada en
  el propio documento del peñista en Firestore -sin Firebase Storage, que
  desde 2024 requiere plan de pago (Blaze)-, así que la app entera sigue
  funcionando en el plan gratuito (Spark).

## Seguridad (PIN de admin)

No hay backend propio, así que el PIN de admin se valida con las reglas de
Firestore (`firestore.rules`): cada escritura de admin incluye el PIN y las
reglas comprueban que coincide con el guardado en `config/general`. Es una
protección sencilla frente a peñistas curiosos, **no** seguridad de nivel
bancario — no hay datos sensibles en juego, solo quién juega al fútbol.

## Estructura del código

- `src/lib/aforo.js`, `src/lib/points.js`, `src/lib/dates.js` — lógica de
  negocio pura (aforo, puntos, cálculo de la convocatoria activa).
- `src/lib/actions.js` — todas las escrituras a Firestore.
- `src/hooks/` — suscripciones en tiempo real a Firestore y estado local
  (peñista elegido, sesión de admin).
- `src/components/` — pantallas; `src/components/admin/` — panel de admin.
- `scripts/smoke-test-logica.mjs` — comprobaciones rápidas de la lógica pura
  (`node scripts/smoke-test-logica.mjs`).
