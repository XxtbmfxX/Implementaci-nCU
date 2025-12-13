import { createBrowserRouter } from "react-router-dom";
import{LoginForm} from "./components/LoginForm";
import { MedicosView } from "./components/medicos-view";
import { DashboardView } from "./components/dashboard-view";
import { AgendaView } from "./components/agenda-view";
import { PacientesView } from "./components/pacientes-view";
import { CitasMedicoView } from "./components/citas-medico-view";
import { Layout } from "./components/layout";
import { AuditoriaView } from "./components/auditoria-view";
import App from "./App";



export const router = createBrowserRouter([
    {path:"/",element: <App/> },
    {path:"/login",element: <LoginForm/> },
    {path:"/medicos",element: <Layout><MedicosView/></Layout> },
    {path:"/dashboard",element: <Layout><DashboardView/></Layout> },
    {path:"/agenda",element: <Layout><AgendaView/></Layout> },
    {path:"/citas",element: <Layout><AgendaView/></Layout> },
    {path:"/pacientes",element: <Layout><PacientesView/></Layout> },
    {path:"/citas-medico",element: <Layout><CitasMedicoView/> </Layout>},
    {path:"/auditoria",element: <Layout><AuditoriaView/></Layout> },
]);