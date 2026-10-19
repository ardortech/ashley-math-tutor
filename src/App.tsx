import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { getPin } from "./lib/storage";
import PinScreen from "./components/PinScreen";
import HomePage from "./pages/HomePage";
import CapturePage from "./pages/CapturePage";
import ConfirmPage from "./pages/ConfirmPage";
import GuidedPage from "./pages/GuidedPage";
import ValidatePage from "./pages/ValidatePage";
import PracticePage from "./pages/PracticePage";
import SettingsPage from "./pages/SettingsPage";
import DressUpPage from "./pages/DressUpPage";

const DevPetPage = lazy(() => import("./pages/DevPetPage"));

export default function App() {
  const [authed, setAuthed] = useState(() => !!getPin());
  const navigate = useNavigate();

  useEffect(() => {
    if (!authed) {
      navigate("/pin", { replace: true });
    }
  }, [authed, navigate]);

  const pinScreen = <PinScreen onSuccess={() => { setAuthed(true); navigate("/", { replace: true }); }} />;

  return (
    <Routes>
      <Route path="/pin" element={pinScreen} />
      <Route path="/" element={authed ? <HomePage /> : pinScreen} />
      <Route path="/capture" element={authed ? <CapturePage /> : pinScreen} />
      <Route path="/confirm" element={authed ? <ConfirmPage /> : pinScreen} />
      <Route path="/guided" element={authed ? <GuidedPage /> : pinScreen} />
      <Route path="/validate" element={authed ? <ValidatePage /> : pinScreen} />
      <Route path="/practice" element={authed ? <PracticePage /> : pinScreen} />
      <Route path="/settings" element={authed ? <SettingsPage /> : pinScreen} />
      <Route path="/dress-up" element={authed ? <DressUpPage /> : pinScreen} />
      <Route path="/dev/pet" element={<Suspense fallback={<div className="p-4">Loading...</div>}><DevPetPage /></Suspense>} />
    </Routes>
  );
}
