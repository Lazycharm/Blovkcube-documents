import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/lib/ProtectedRoute';
import Layout from '@/Layout';
import PageNotFound from '@/lib/PageNotFound';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Subscribe from '@/pages/Subscribe';
import CompanySettings from '@/pages/CompanySettings';
import Dashboard from '@/pages/Dashboard';
import CreateDocument from '@/pages/CreateDocument';
import DocumentHistory from '@/pages/DocumentHistory';
import DocumentPreview from '@/pages/DocumentPreview';
import CreateWarranty from '@/pages/CreateWarranty';
import WarrantyHistory from '@/pages/WarrantyHistory';
import WarrantyPreview from '@/pages/WarrantyPreview';

const WithLayout = ({ children, page }) => (
  <ProtectedRoute>
    <Layout currentPageName={page}>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/" element={<WithLayout page="Dashboard"><Dashboard /></WithLayout>} />
            <Route path="/Dashboard" element={<WithLayout page="Dashboard"><Dashboard /></WithLayout>} />
            <Route path="/CompanySettings" element={<WithLayout page="CompanySettings"><CompanySettings /></WithLayout>} />
            <Route path="/Subscribe" element={<WithLayout page="Subscribe"><Subscribe /></WithLayout>} />
            <Route path="/CreateDocument" element={<WithLayout page="CreateDocument"><CreateDocument /></WithLayout>} />
            <Route path="/DocumentHistory" element={<WithLayout page="DocumentHistory"><DocumentHistory /></WithLayout>} />
            <Route path="/DocumentPreview" element={<WithLayout page="DocumentPreview"><DocumentPreview /></WithLayout>} />
            <Route path="/CreateWarranty" element={<WithLayout page="CreateWarranty"><CreateWarranty /></WithLayout>} />
            <Route path="/WarrantyHistory" element={<WithLayout page="WarrantyHistory"><WarrantyHistory /></WithLayout>} />
            <Route path="/WarrantyPreview" element={<WithLayout page="WarrantyPreview"><WarrantyPreview /></WithLayout>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
