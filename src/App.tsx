import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPin } from "./lib/storage";
import PinScreen from "./components/PinScreen";
import HomePage from "./pages/HomePage";
import CapturePage from "./pages/CapturePage";

export default function App() {
  const [authed, setAuthed] = useState(() => !!getPin());
  const navigate = useNavigate();

  useEffect(() => {
    if (!authed) {
      navigate("/pin", { replace: true });
    }
  }, [authed, navigate]);

  return (
    <Routes>
      <Route
        path="/pin"
        element={<PinScreen onSuccess={() => { setAuthed(true); navigate("/", { replace: true }); }} />}
      />
      <Route path="/" element={authed ? <HomePage /> : <PinScreen onSuccess={() => { setAuthed(true); navigate("/", { replace: true }); }} />} />
      <Route path="/capture" element={authed ? <CapturePage /> : <PinScreen onSuccess={() => { setAuthed(true); navigate("/", { replace: true }); }} />} />
    </Routes>
  );
}
