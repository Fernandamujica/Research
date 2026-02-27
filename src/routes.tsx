import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ResearchDetailPage } from './pages/ResearchDetailPage';
import { EditResearchPage } from './pages/EditResearchPage';
import { SubmitResearchPage } from './pages/SubmitResearchPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'pesquisa/:id', element: <ResearchDetailPage /> },
      { path: 'pesquisa/:id/edit', element: <EditResearchPage /> },
      { path: 'submit', element: <SubmitResearchPage /> },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
