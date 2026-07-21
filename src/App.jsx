import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Inicio from './pages/Inicio.jsx'
import NuevaPropuesta from './pages/NuevaPropuesta.jsx'
import Resultados from './pages/Resultados.jsx'
import Comparar from './pages/Comparar.jsx'
import ReferenciasMercado from './pages/ReferenciasMercado.jsx'
import Configuracion from './pages/Configuracion.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/nueva" element={<NuevaPropuesta />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/comparar" element={<Comparar />} />
          <Route path="/referencias" element={<ReferenciasMercado />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
