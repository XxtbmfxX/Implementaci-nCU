
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from "sonner";
import { router } from "./router";
import "./index.css";

console.log(
  `%c 🚀 Aplicación iniciada en modo: ${import.meta.env.MODE} | Mocks: ${import.meta.env.VITE_USE_MOCKS}`,
  'background: #222; color: #bada55; padding: 4px; border-radius: 4px;'
);

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <Toaster position="top-right" richColors />
    <RouterProvider router={router} />
  </AuthProvider>
);
