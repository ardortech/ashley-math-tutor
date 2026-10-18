import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPin } from "./lib/storage";
import PinScreen from "./components/PinScreen";
import HomePage from "./pages/HomePage";
import CapturePage from "./pages/CapturePage";
import ConfirmPage from "./pages/ConfirmPage";

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
    </Routes>
  );
}
