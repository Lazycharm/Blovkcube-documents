import CreateDocument from './pages/CreateDocument';
import Dashboard from './pages/Dashboard';
import DocumentHistory from './pages/DocumentHistory';
import DocumentPreview from './pages/DocumentPreview';
import __Layout from './Layout.jsx';

export const PAGES = {
    "CreateDocument": CreateDocument,
    "Dashboard": Dashboard,
    "DocumentHistory": DocumentHistory,
    "DocumentPreview": DocumentPreview,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};