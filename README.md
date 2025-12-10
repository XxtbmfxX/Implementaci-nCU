
  # Implementar Sistema de Casos de Uso

  This is a code bundle for Implementar Sistema de Casos de Uso. The original project is available at https://www.figma.com/design/KalIEtFRiG7P1CHr4yzoyt/Implementar-Sistema-de-Casos-de-Uso.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Capa de datos (mock)
  - El cliente se resuelve vía `src/lib/api-client.ts` y actualmente usa `MockApiClient` (datos en `src/mocks/*`).
  - Ajusta `VITE_USE_MOCKS` en `.env` (por defecto mock) para cambiar de origen cuando se integre un backend.
  