import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { NewAudit } from './pages/NewAudit';
import { ScanHistory } from './pages/ScanHistory';
import { DependencyExplorer } from './pages/DependencyExplorer';
import { IPv4VsIPv6 } from './pages/IPv4VsIPv6';
import { Benchmark } from './pages/Benchmark';
import { ControlledLab } from './pages/ControlledLab';
import { Reports } from './pages/Reports';
import { Methodology } from './pages/Methodology';

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/new-audit" element={<NewAudit />} />
          <Route path="/history" element={<ScanHistory />} />
          <Route path="/explorer" element={<DependencyExplorer />} />
          <Route path="/parity" element={<IPv4VsIPv6 />} />
          <Route path="/benchmark" element={<Benchmark />} />
          <Route path="/lab" element={<ControlledLab />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
