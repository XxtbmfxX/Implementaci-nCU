import { useRouteError, isRouteErrorResponse, Link } from 'react-router';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export function RootError() {
  const error = useRouteError();
  let errorMessage: string;
  let errorTitle: string;

  if (isRouteErrorResponse(error)) {
    // Errores lanzados por loaders/actions (ej: throw new Response("Not Found", { status: 404 }))
    errorTitle = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || error.data || 'Ocurrió un error en la solicitud.';
  } else if (error instanceof Error) {
    // Errores no controlados (ej: excepciones en render)
    errorTitle = 'Error Inesperado';
    errorMessage = error.message;
  } else {
    errorTitle = 'Error Desconocido';
    errorMessage = 'Ha ocurrido un error desconocido.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorTitle}</h1>
        <p className="text-gray-600 mb-8">{errorMessage}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
