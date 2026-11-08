import "@mroiban/onyx/styles.css";
import "@mroiban/golem/tokens.css";
import "@mroiban/golem/anima-slots.css";
import "@mroiban/golem/styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@mroiban/onyx";
import { GolemProvider, modelCacheSize, mountMetrics, onRuntimeState, runtimeState, useGolem, type MotionSetting } from "@mroiban/golem/anima";
import { themes } from "@mroiban/golem/tokens";
import { Switch } from "@mroiban/golem";
import { SECTIONS } from "./sections";
import { Segmented } from "./ui";

// URL parameters (tests use them): ?theme=light|dark|rose|rose-dark  ?motion=system|anima|css|reduced
// ?anima=off (no Anima runtime: the fallback)  ?many=N (N extra switches, for mount timing)
// ?c=<id>[,<id>…]: only those component sections (and no mount-timing card unless ?many is set)
// ?provider=off: no GolemProvider and no configuration, as a pebble that only swapped its imports
// (motion follows the OS, the runtime comes from the page's <meta name="golem-anima-runtime">).
const params = new URLSearchParams(location.search);
const ANIMA = params.get("anima") === "off" ? null : "/anima/anima.js";
const MANY = Math.min(500, Number(params.get("many") ?? 24));
const PROVIDER = params.get("provider") !== "off";
const ONLY = params.get("c")?.split(",");
const SHOWN = SECTIONS.filter((s) => !ONLY || ONLY.includes(s.id));

function useRuntimeState() {
  return React.useSyncExternalStore(onRuntimeState, runtimeState);
}

function Metrics() {
  const runtime = useRuntimeState();
  const { motion } = useGolem();
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => { const t = setInterval(tick, 500); return () => clearInterval(t); }, []);
  const first = mountMetrics.find((m) => !m.cached);
  const cached = mountMetrics.filter((m) => m.cached);
  const mean = cached.length ? cached.reduce((a, m) => a + m.ms, 0) / cached.length : 0;
  const total = mountMetrics.length ? Math.max(...mountMetrics.map((m) => m.at)) : 0;
  return (
    <dl className="metrics" data-testid="metrics">
      <dt>Motion</dt><dd data-testid="motion">{motion}</dd>
      <dt>Anima runtime</dt><dd data-testid="runtime">{runtime}</dd>
      <dt>Anima controls</dt><dd data-testid="mounted">{mountMetrics.length}</dd>
      <dt>Compiled models</dt><dd data-testid="models">{modelCacheSize()}</dd>
      <dt>First mount</dt><dd>{first ? `${first.waitMs.toFixed(1)} ms fetch + compile, ${first.ms.toFixed(1)} ms instantiate` : "—"}</dd>
      <dt>Cached mounts</dt><dd>{cached.length ? `${mean.toFixed(2)} ms mean instantiate, ${cached.length} controls` : "—"}</dd>
      <dt>All mounted</dt><dd data-testid="all-mounted">{total ? `${total.toFixed(0)} ms after navigation start` : "—"}</dd>
    </dl>
  );
}

const ANIMA_CONFIG = { runtime: ANIMA, scenes: "/anima/scenes/" };
/** The demo with or without GolemProvider (?provider=off). Module-level so it never remounts the tree. */
function Wrap({ theme, motion, children }: { theme: string; motion: MotionSetting; children: React.ReactNode }) {
  return PROVIDER
    ? <GolemProvider theme={theme} motion={motion} anima={ANIMA_CONFIG}>{children}</GolemProvider>
    : <>{children}</>;
}

function App() {
  const [theme, setTheme] = React.useState(params.get("theme") ?? "dark");
  const [motion, setMotion] = React.useState<MotionSetting>((params.get("motion") as MotionSetting) ?? "system");
  // Without a provider the page owns <html data-theme>, as any Onyx page does.
  React.useLayoutEffect(() => { if (!PROVIDER) document.documentElement.dataset.theme = theme; }, [theme]);
  return (
    <Wrap theme={theme} motion={motion}>
      <main className="page onyx-theme-root">
        <header className="head">
          <h1>Golem</h1>
          <p className="lede">Onyx primitives with Anima motion parts. One token source for both.</p>
          <div className="controls">
            <Segmented label="Theme" value={theme} onChange={setTheme}
              options={Object.values(themes).map((t) => [t.name, t.label])} />
            {PROVIDER ? <Segmented label="Motion" value={motion} onChange={setMotion}
              options={[["system", "System"], ["anima", "Anima"], ["css", "Onyx"], ["reduced", "Reduced"]]} />
              : <p className="lede" data-testid="no-provider">No GolemProvider: motion follows the system setting.</p>}
          </div>
        </header>

        {SHOWN.map(({ id, Component }) => <Component key={id} />)}

        {(!ONLY || ONLY.includes("switch") || params.has("many")) && (
        <Card className="card">
          <CardHeader>
            <CardTitle>Progressive mounting</CardTitle>
            <CardDescription>{MANY} more switches. Each shows as plain Onyx at once; its Anima part mounts a few per frame, visible ones first, from one compiled model.</CardDescription>
          </CardHeader>
          <CardBody>
            <Metrics />
            <div className="many" data-testid="many">
              {Array.from({ length: MANY }, (_, i) => <Switch key={i} defaultChecked={i % 3 === 0} aria-label={`Option ${i + 1}`} />)}
            </div>
          </CardBody>
        </Card>
        )}
        {ONLY && !ONLY.includes("switch") && !params.has("many") && <Metrics />}
      </main>
    </Wrap>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
