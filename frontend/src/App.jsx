import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Settings from './pages/Settings';
import BotConfig from './pages/BotConfig';
import Marketing from './pages/Marketing';
import Pricing from './pages/Pricing';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Limpa para Autenticação Supabase */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas dentro do Layout Principal */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bot" element={<BotConfig />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="pricing" element={<Pricing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
