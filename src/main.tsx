
  import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from "sonner";
import { router } from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <Toaster position="top-right" richColors />
    <RouterProvider router={router} />
  </AuthProvider>
);
  