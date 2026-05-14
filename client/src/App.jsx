import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ControlPanel from './pages/ControlPanel';
import BanPickOverlay from './pages/BanPickOverlay';
import MatchOverlay from './pages/MatchOverlay';
import PlayerUI from './pages/PlayerUI';
import './App.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-logo">🎮</div>
        <h1 className="home-title">Maimai Tournament</h1>
        <p className="home-subtitle">System Dashboard</p>

        <div className="home-cards">
          <Link to="/control-panel" className="home-card">
            <div className="home-card-icon">⚙️</div>
            <div className="home-card-label">Control Panel</div>
            <div className="home-card-desc">Admin – Quản lý trận đấu</div>
          </Link>

          <Link to="/player" className="home-card">
            <div className="home-card-icon">📱</div>
            <div className="home-card-label">Player UI</div>
            <div className="home-card-desc">iPad – Ban/Pick bài hát</div>
          </Link>

          <Link to="/overlay/ban-pick" className="home-card">
            <div className="home-card-icon">🖥️</div>
            <div className="home-card-label">Ban/Pick Overlay</div>
            <div className="home-card-desc">OBS – Scene ban/pick</div>
          </Link>

          <Link to="/overlay/match" className="home-card">
            <div className="home-card-icon">🎬</div>
            <div className="home-card-label">Match Overlay</div>
            <div className="home-card-desc">OBS – Scene thi đấu</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/control-panel" element={<ControlPanel />} />
        <Route path="/player" element={<PlayerUI />} />
        <Route path="/overlay/ban-pick" element={<BanPickOverlay />} />
        <Route path="/overlay/match" element={<MatchOverlay />} />
      </Routes>
    </Router>
  );
}

export default App;
