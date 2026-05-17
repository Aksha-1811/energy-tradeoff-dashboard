import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./styles.css";
import Home from "./pages/Home";
import EnergyTradeoffDashboard from "./pages/EnergyTradeOffDashboard";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/energy-tradeoff" element={<EnergyTradeoffDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
