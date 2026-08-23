import { Footer, TopBar } from "./components/Chrome";
import { AdaptabilityIndex, RefactorCode, ScopeDelta, Verdict } from "./components/Docs";
import { Floor, PivotBanner } from "./components/Floor";
import { Trail } from "./components/Trail";
import { useSimulation } from "./sim";

export default function App() {
  const api = useSimulation();

  return (
    <div id="top" className="relative min-h-screen">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="layer-glow absolute inset-0" />
        <div className="layer-grid absolute inset-0" />
        <div className="layer-noise absolute inset-0" />
      </div>

      {/* rotating solstice mark */}
      <div
        className="pointer-events-none fixed -right-40 -top-40 z-0 opacity-[0.05]"
        aria-hidden
      >
        <svg width="640" height="640" viewBox="0 0 640 640" fill="none" className="spin-slow">
          <circle cx="320" cy="320" r="290" stroke="#fbbf24" strokeWidth="2" strokeDasharray="10 16" />
          <circle cx="320" cy="320" r="200" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="320" cy="320" r="110" fill="#fbbf24" />
          <path d="M320 8v64M320 568v64M8 320h64M568 320h64" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10">
        <TopBar />
        <PivotBanner />
        <main>
          <Floor api={api} />
          <Verdict api={api} />
          <ScopeDelta />
          <RefactorCode />
          <AdaptabilityIndex api={api} />
          <Trail api={api} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
