import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from '@/Layout';
import PageNotFound from '@/lib/PageNotFound';
import Dashboard from '@/pages/Dashboard';
import CreateDocument from '@/pages/CreateDocument';
import DocumentHistory from '@/pages/DocumentHistory';
import DocumentPreview from '@/pages/DocumentPreview';
import CreateWarranty from '@/pages/CreateWarranty';
import WarrantyHistory from '@/pages/WarrantyHistory';
import WarrantyPreview from '@/pages/WarrantyPreview';

const WithLayout = ({ children, page }) => (
  <Layout currentPageName={page}>{children}</Layout>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<WithLayout page="Dashboard"><Dashboard /></WithLayout>} />
            <Route path="/Dashboard" element={<WithLayout page="Dashboard"><Dashboard /></WithLayout>} />
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
