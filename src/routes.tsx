import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ResearchDetailPage } from './pages/ResearchDetailPage';
import { EditResearchPage } from './pages/EditResearchPage';
import { SubmitResearchPage } from './pages/SubmitResearchPage';
import { CrossGeoInsightsPage } from './pages/CrossGeoInsightsPage';

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'pesquisa/:id', element: <ResearchDetailPage /> },
      { path: 'pesquisa/:id/edit', element: <EditResearchPage /> },
      { path: 'submit', element: <SubmitResearchPage /> },
      { path: 'cross-geo', element: <CrossGeoInsightsPage /> },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
