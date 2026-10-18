import { useNavigate } from "react-router-dom";
import CaptureScreen from "../components/CaptureScreen";

export default function CapturePage() {
  const navigate = useNavigate();
  return <CaptureScreen onBack={() => navigate("/")} />;
}
