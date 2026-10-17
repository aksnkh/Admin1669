import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Orders from './pages/Orders';
function Protected() {
  return useAuth().authenticated ? <Layout /> : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route index element={<Home />} />
            <Route path="orders-report" element={<Orders key="report" />} />
            <Route path="referral" element={<Orders key="referral" referral />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
