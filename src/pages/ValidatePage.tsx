import { useNavigate } from "react-router-dom";
import StepPills from "../components/StepPills";
import TiaoTiaoHeadCurious from "../components/pet/TiaoTiaoHeadCurious";

export default function ValidatePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-bg">
      <StepPills current={3} />
      <div className="flex flex-col items-center px-6 pt-16">
        <div style={{ width: 80, height: 96 }}>
          <TiaoTiaoHeadCurious className="w-full h-full" />
        </div>
        <p className="mt-4 text-lg font-medium text-ink text-center">
          批改功能即將推出！
        </p>
        <p className="mt-2 text-sm text-muted text-center">
          拍照批改和練習題功能正在開發中，敬請期待 ✨
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white
            shadow-[0_6px_0_0_var(--color-primary-pressed)]
            active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
            transition-all"
        >
          回首頁
        </button>
      </div>
    </div>
  );
}
