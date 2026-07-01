
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Player from './pages/Player';

// Placeholder components for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="animate-in">
    <h1 className="heading-lg">{title}</h1>
    <p className="text-muted">This page is under construction.</p>
  </div>
);

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="player" element={<Player />} />
            <Route path="library" element={<Placeholder title="Library" />} />
            <Route path="bookmarks" element={<Placeholder title="Bookmarks" />} />
            <Route path="history" element={<Placeholder title="History" />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<Placeholder title="About" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
