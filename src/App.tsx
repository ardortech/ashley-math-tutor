import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { getPin } from "./lib/storage";
import PinScreen from "./components/PinScreen";
import LegacyRedirect from "./components/LegacyRedirect";
import LandingPage from "./pages/LandingPage";
import MathHomePage from "./pages/MathHomePage";
import CapturePage from "./pages/CapturePage";
import ConfirmPage from "./pages/ConfirmPage";
import GuidedPage from "./pages/GuidedPage";
import ValidatePage from "./pages/ValidatePage";
import PracticePage from "./pages/PracticePage";
import ChineseHomePage from "./pages/ChineseHomePage";
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

  function guard(element: React.ReactNode) {
    return authed ? element : pinScreen;
  }

  return (
    <Routes>
      <Route path="/pin" element={pinScreen} />
      <Route path="/" element={guard(<LandingPage />)} />

      {/* Math routes */}
      <Route path="/math" element={guard(<MathHomePage />)} />
      <Route path="/math/capture" element={guard(<CapturePage />)} />
      <Route path="/math/confirm" element={guard(<ConfirmPage />)} />
      <Route path="/math/guided" element={guard(<GuidedPage />)} />
      <Route path="/math/validate" element={guard(<ValidatePage />)} />
      <Route path="/math/practice" element={guard(<PracticePage />)} />

      {/* Legacy math redirects (preserve state + query string) */}
      <Route path="/capture" element={<LegacyRedirect to="/math/capture" />} />
      <Route path="/confirm" element={<LegacyRedirect to="/math/confirm" />} />
      <Route path="/guided" element={<LegacyRedirect to="/math/guided" />} />
      <Route path="/validate" element={<LegacyRedirect to="/math/validate" />} />
      <Route path="/practice" element={<LegacyRedirect to="/math/practice" />} />

      {/* Chinese routes */}
      <Route path="/chinese" element={guard(<ChineseHomePage />)} />

      {/* Shared routes */}
      <Route path="/settings" element={guard(<SettingsPage />)} />
      <Route path="/dress-up" element={guard(<DressUpPage />)} />
      <Route path="/dev/pet" element={<Suspense fallback={<div className="p-4">Loading...</div>}><DevPetPage /></Suspense>} />
    </Routes>
  );
}
