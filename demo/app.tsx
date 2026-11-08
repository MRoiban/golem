import "@mroiban/onyx/styles.css";
import "@mroiban/golem/tokens.css";
import "@mroiban/golem/anima-slots.css";
import "@mroiban/golem/styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Field, FieldDescription, Label, Switch as OnyxSwitch, ToggleGroup, ToggleGroupItem } from "@mroiban/onyx";
import { GolemProvider, modelCacheSize, mountMetrics, onRuntimeState, runtimeState, useGolem, type MotionSetting } from "@mroiban/golem/anima";
import { themes } from "@mroiban/golem/tokens";
import { Switch } from "@mroiban/golem";

// URL parameters (tests use them): ?theme=light|dark|rose|rose-dark  ?motion=system|anima|css|reduced
// ?anima=off (no Anima runtime: the fallback)  ?many=N (N extra switches, for mount timing)
// ?provider=off: no GolemProvider and no configuration, as a pebble that only swapped its imports
// (motion follows the OS, the runtime comes from the page's <meta name="golem-anima-runtime">).
const params = new URLSearchParams(location.search);
const ANIMA = params.get("anima") === "off" ? null : "/anima/anima.js";
const MANY = Math.min(500, Number(params.get("many") ?? 24));
const PROVIDER = params.get("provider") !== "off";

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      <span className="seg-label" id={`seg-${label}`}>{label}</span>
      <ToggleGroup type="single" aria-labelledby={`seg-${label}`} value={value}
        onValueChange={(v: string) => { if (v) onChange(v as T); }}>
        {options.map(([v, text]) => <ToggleGroupItem key={v} value={v}>{text}</ToggleGroupItem>)}
      </ToggleGroup>
    </div>
  );
}

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

function SettingRow({ id, label, description, children }: { id: string; label: string; description: string; children: React.ReactNode }) {
  return (
    <Field className="row" id={id}>
      <div className="row-text">
        <Label>{label}</Label>
        <FieldDescription>{description}</FieldDescription>
      </div>
      {children}
    </Field>
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
  const [sync, setSync] = React.useState(true);
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

        <Card className="card">
          <CardHeader>
            <CardTitle>Switch</CardTitle>
            <CardDescription>Onyx's switch; with Anima motion the thumb stretches as it travels and squashes while pressed.</CardDescription>
          </CardHeader>
          <CardBody className="rows">
            <SettingRow id="autosave" label="Auto save" description="Save changes as you type.">
              <Switch defaultChecked data-testid="autosave" />
            </SettingRow>
            <SettingRow id="sync" label="Sync" description={`Controlled: ${sync ? "on" : "off"}.`}>
              <Switch checked={sync} onCheckedChange={setSync} data-testid="sync" />
            </SettingRow>
            <SettingRow id="beta" label="Beta features" description="Off by default.">
              <Switch data-testid="beta" />
            </SettingRow>
            <SettingRow id="locked" label="Managed by your organisation" description="Disabled.">
              <Switch defaultChecked disabled data-testid="locked" />
            </SettingRow>
            <SettingRow id="plain" label="Plain Onyx (reference)" description="The primitive Golem wraps, never animated by Anima.">
              <OnyxSwitch defaultChecked data-testid="plain" />
            </SettingRow>
          </CardBody>
        </Card>

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
      </main>
    </Wrap>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
