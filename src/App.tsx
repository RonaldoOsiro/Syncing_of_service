import { Footer, Nav } from "./components/Chrome";
import { Hero } from "./components/Hero";
import { ShipLog, Deploy } from "./components/Outro";
import { Playground } from "./components/Playground";
import { HowItWorks, Security } from "./components/Showcase";

export default function App() {
  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="layer-wash absolute inset-0" />
        <div className="layer-grid-light absolute inset-0" />
        <div className="layer-noise absolute inset-0" />
      </div>

      <div className="relative z-10">
        <Nav />
        <main>
          <Hero />
          <HowItWorks />
          <Security />
          <Playground />
          <Deploy />
          <ShipLog />
        </main>
        <Footer />
      </div>
    </div>
  );
}
