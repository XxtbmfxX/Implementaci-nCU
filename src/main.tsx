import { createRoot } from "react-dom/client";
import "./index.css";

import { RouterProvider } from "react-router-dom";
import { router } from "./router.jsx";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from 'sonner';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <Toaster position="top-right" richColors />
    <RouterProvider router={router} />
  </AuthProvider>
);
