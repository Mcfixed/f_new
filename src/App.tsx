import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import SensorAnalysis from './views/SensorAnalysis';
import SystemLog from './views/SystemLog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sensors" element={<SensorAnalysis />} />
          <Route path="logs" element={<SystemLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
