import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { ToastProvider } from './components/Toast'
import { AppLayout } from './components/AppLayout'
import { ApiError } from './api/client'
import Login from './pages/Login'
import NoEncontrada from './pages/NoEncontrada'
import Dashboard from './pages/Dashboard'
import Medicamentos from './pages/Medicamentos'
import Inventario from './pages/Inventario'
import Movimientos from './pages/Movimientos'
import Dispensar from './pages/Dispensar'
import Alertas from './pages/Alertas'
import Reportes from './pages/Reportes'
import Calendario from './pages/Calendario'
import Proveedores from './pages/Proveedores'
import Categorias from './pages/Categorias'
import Usuarios from './pages/Usuarios'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (n, e) => !(e instanceof ApiError && (e.status === 0 || (e.status >= 400 && e.status < 500))) && n < 1,
    },
  },
})

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="medicamentos" element={<Medicamentos />} />
                  <Route path="inventario" element={<Inventario />} />
                  <Route path="movimientos" element={<Movimientos />} />
                  <Route path="dispensar" element={<Dispensar />} />
                  <Route path="alertas" element={<Alertas />} />
                  <Route path="reportes" element={<Reportes />} />
                  <Route path="calendario" element={<Calendario />} />
                  <Route path="proveedores" element={<Proveedores />} />
                  <Route path="categorias" element={<Categorias />} />
                  <Route element={<RequireAuth roles={['admin']} />}><Route path="usuarios" element={<Usuarios />} /></Route>
                  <Route path="*" element={<NoEncontrada />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
