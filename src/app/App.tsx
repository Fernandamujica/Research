import { ResearchProvider } from '../context/ResearchContext';
import { Routes } from '../routes';

export default function App() {
  return (
    <ResearchProvider>
      <Routes />
    </ResearchProvider>
  );
}
