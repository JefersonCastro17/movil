# Mercapleno Expo React Native

Migracion de `mercapleno-react-vite` a una app movil con Expo + React Native.

## 1) Alcance de la migracion

Se migro la logica principal del proyecto web a mobile:

- Autenticacion: login, registro, verificacion de correo, recuperacion de contrasena.
- Venta: catalogo, filtros, carrito, checkout y ticket.
- Operaciones: dashboard por rol.
- Admin: CRUD de productos, CRUD de usuarios.
- Inventario: registro de entradas y salidas.
- Reportes: resumen de ventas, top productos, ventas por mes y resumen mensual.

## 2) Carpeta del proyecto

La app movil vive en:

`C:\Users\jefer\OneDrive\Escritorio\mercapleno-expo`

Estructura principal:

```
src/
  components/ui/
  contexts/
  navigation/
  screens/
    auth/
    shop/
    admin/
  lib/
    api/
    config/
    hooks/
    services/
    storage/
```

## 3) Stack usado

- Expo SDK 55
- React Native 0.83
- React Navigation (native-stack)
- AsyncStorage
- Picker nativo (`@react-native-picker/picker`)

## 4) Configuracion de API

La app usa los mismos endpoints del proyecto web.

Archivo:
- `src/lib/config/api.config.js`

Base URL:
- `src/lib/config/env.js`
- Variable: `EXPO_PUBLIC_API_URL`
- Fallback inteligente:
  - Android emulador: `http://10.0.2.2:4000`
  - iOS/web: `http://localhost:4000`
  - Si detecta host de Expo LAN, reemplaza `localhost` automaticamente por la IP LAN
- Ejemplo: `.env.example`

Puedes crear un archivo `.env` en `mercapleno-expo` usando ese valor base.

### Nota importante para pruebas en dispositivo/emulador

- Si pruebas en emulador Android, normalmente `localhost` no apunta al backend de tu PC.
- Usa una URL alcanzable por el dispositivo (IP local o tunel), por ejemplo:

`EXPO_PUBLIC_API_URL=http://192.168.1.15:4000`

## 5) Comandos

Desde `mercapleno-expo`:

```bash
npm install
npm run start
npm run start:tunnel
npm run android
npm run ios
npm run web
```

Notas:
- En Windows no puedes abrir simulador iOS nativo con `npm run ios`; para iPhone usa Expo Go y QR.
- Si Android/iPhone no conectan por LAN, usa `npm run start:tunnel`.

## 6) Colores (alineados al original)

Se centralizo tema en `src/theme/colors.js` con la paleta del proyecto original:

- Primario: `#0066CC`
- Acento: `#FFA500` / `#F9B300`
- Secundario: `#3faac5`
- Peligro: `#D9534F`
- Fondo base: `#f5f5f5`

Estos colores se aplican en navegación, botones, formularios, cards y pantallas principales.

## 7) Mapeo Web -> Mobile

- `/login` -> `LoginScreen`
- `/registro` -> `RegisterScreen`
- `/verificar` -> `VerifyScreen`
- `/recuperar` -> `RecoverScreen`
- `/catalogo` -> `InventoryScreen`
- `/cart` -> `CartScreen`
- `/ticket` -> `TicketScreen`
- `/usuarioC` -> `DashboardScreen`
- `/products/admin` -> `ProductsAdminScreen`
- `/products/employee` -> `MovementsScreen`
- `/admin/users` -> `UsersAdminScreen`
- `/estadisticas` -> `StatsScreen`

## 8) Estado actual de la migracion

Implementado:

- Navegacion por estado de sesion y rol.
- Persistencia de sesion en `AsyncStorage`.
- Persistencia de carrito y ticket en `AsyncStorage`.
- Servicios HTTP reutilizando contratos de backend existentes.
- Control de errores 401/403 con cierre de sesion.

Diferencias frente a web (intencionales en esta fase):

- Reportes en mobile muestran KPI/listados (sin graficas tipo Recharts).
- Flujo PDF de reportes no se incluyo dentro de la app movil en esta version.
- Inputs de fecha usan texto `YYYY-MM-DD` o `YYYY-MM` para compatibilidad simple.

## 9) Validacion ejecutada

Se verifico:

- `npx expo-doctor` -> OK (17/17 checks).
- Build web de validacion con `npx expo export --platform web` -> OK.

La carpeta `dist-test/` fue generada por esa validacion.

## 10) Siguientes mejoras sugeridas

- Integrar selector de fecha nativo.
- Agregar graficas moviles (`react-native-chart-kit` o equivalente).
- Implementar descarga/visualizacion de PDF de reportes en mobile.
- Agregar pruebas de componentes y pruebas e2e.
