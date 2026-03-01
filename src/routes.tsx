import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ResearchDetailPage } from './pages/ResearchDetailPage';
import { EditResearchPage } from './pages/EditResearchPage';
import { SubmitResearchPage } from './pages/SubmitResearchPage';
import { CrossGeoInsightsPage } from './pages/CrossGeoInsightsPage';
import { SettingsPage } from './pages/SettingsPage';

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'research/:id', element: <ResearchDetailPage /> },
      { path: 'research/:id/edit', element: <EditResearchPage /> },
      { path: 'submit', element: <SubmitResearchPage /> },
      { path: 'cross-geo', element: <CrossGeoInsightsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
