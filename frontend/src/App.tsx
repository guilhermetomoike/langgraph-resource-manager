import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import AnalyzeResources from './pages/AnalyzeResources';
import ConflictDetection from './pages/ConflictDetection';
import Solutions from './pages/Solutions';
import Feedback from './pages/Feedback';
import Simulation from './pages/Simulation';
import Orchestration from './pages/Orchestration';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orchestration" element={<Orchestration />} />
          <Route path="/analyze" element={<AnalyzeResources />} />
          <Route path="/conflicts" element={<ConflictDetection />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/simulation" element={<Simulation />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
