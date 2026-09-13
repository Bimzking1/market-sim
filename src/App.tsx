import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useGameStore } from "./store/gameStore";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./pages/SplashScreen";
import { IntroScreen } from "./pages/IntroScreen";
import { Dashboard } from "./pages/Dashboard";
import { Market } from "./pages/Market";
import { RemoteMarket } from "./pages/RemoteMarket";
import { History } from "./pages/History";
import { Map } from "./pages/Map";
import { Garage } from "./pages/Garage";
import { WarehousePage } from "./pages/Warehouse";
import { Inventory } from "./pages/Inventory";
import { Almanac } from "./pages/Almanac";
import { Bank } from "./pages/Bank";
import { Report } from "./pages/Report";
import { Insights } from "./pages/Insights";
import { Help } from "./pages/Help";
import { Changelog } from "./pages/Changelog";

function GameGuard({ children }: { children: React.ReactNode }) {
  const gameStarted = useGameStore((s) => s.gameStarted);
  if (!gameStarted) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/intro" element={<IntroScreen />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route
          element={
            <GameGuard>
              <AppShell />
            </GameGuard>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/market" element={<Market />} />
          <Route path="/market-remote" element={<RemoteMarket />} />
          <Route path="/history" element={<History />} />
          <Route path="/map" element={<Map />} />
          <Route path="/garage" element={<Garage />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/almanac" element={<Almanac />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/help" element={<Help />} />
          <Route path="/report" element={<Report />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
