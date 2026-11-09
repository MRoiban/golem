// The playground: every Golem component on one page, laid out as a gallery, for people to play
// with and look for bugs. bun demo/server.ts, then /play. The settings live in the URL so a bug can
// be shared as a link: ?theme=… &motion=system|anima|css|reduced &density=compact|comfortable
// &plain=1 (plain Onyx beside each component) &anima=off (no Anima runtime: the fallback).
import "@mroiban/onyx/styles.css";
import "@mroiban/golem/tokens.css";
import "@mroiban/golem/anima-slots.css";
import "@mroiban/golem/styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import * as Onyx from "@mroiban/onyx";
import { GolemProvider, onRuntimeState, runtimeState, useGolem, type MotionSetting } from "@mroiban/golem/anima";
import { themes } from "@mroiban/golem/tokens";
import {
  Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger, Alert, Button, Checkbox,
  Collapsible, CollapsibleContent, CollapsibleTrigger, Meter, PasswordField, Progress, RadioGroup,
  RadioGroupItem, SectionSelect, Slider, Spinner, Switch, Tabs, TabsContent, TabsList, TabsTrigger,
  ToastProvider, Toggle, ToggleGroup, ToggleGroupItem, useToast,
} from "@mroiban/golem";

const params = new URLSearchParams(location.search);
const ANIMA_OFF = params.get("anima") === "off";
// Where Anima lives comes from the page's <meta> tags: the dev server serves /anima/, and the static
// site (scripts/build-site.ts) rewrites them to a per-commit path, so a cached runtime can never be
// paired with newer Golem code.
const meta = (name: string) => document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content;
const ANIMA = { runtime: ANIMA_OFF ? null : meta("golem-anima-runtime") ?? "/anima/anima.js", scenes: meta("golem-anima-scenes") ?? "/anima/scenes/" };
const on = (b: boolean) => (b ? "on" : "off");

// ---- the event log: an external store, so logging never re-renders the cells ----
type Entry = { id: number; at: number; source: string; text: string };
let entries: Entry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function log(source: string, text: string) {
  entries = [{ id: nextId++, at: performance.now(), source, text }, ...entries].slice(0, 80);
  emit();
}
const subscribeLog = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

// ---- stress: each cell registers a burst of rapid state changes; "Stress everything" runs them all ----
const stressers = new Set<() => void>();
function useStress(fn: () => void) {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => {
    const run = () => ref.current();
    stressers.add(run);
    return () => { stressers.delete(run); };
  }, []);
  return () => ref.current();
}
/** n calls of step, gap ms apart. */
function burst(n: number, gap: number, step: (i: number) => void) {
  for (let i = 0; i < n; i++) setTimeout(() => step(i), i * gap);
}

const PlainContext = React.createContext(false);

// ---- layout ----
function Group({ n, id, title, children }: { n: number; id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="group" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}><span>{n}</span> · {title}</h2>
      <div className="grid">{children}</div>
    </section>
  );
}

function Cell({ id, title, tag, note, state, wide, reference, onStress, children }: {
  id: string; title: string; tag?: string; note?: React.ReactNode; state?: string; wide?: boolean;
  reference?: React.ReactNode; onStress?: () => void; children: React.ReactNode;
}) {
  const plain = React.useContext(PlainContext);
  return (
    <article className={wide ? "cell wide" : "cell"} data-cell={id} aria-labelledby={`cell-${id}`}>
      <header className="cell-head">
        <h3 id={`cell-${id}`}>{title}</h3>
        {tag && <code>{tag}</code>}
      </header>
      <div className="cell-body">{children}</div>
      {plain && reference && (
        <div className="reference" data-testid={`reference-${id}`}>
          <span className="reference-label">Plain Onyx</span>
          {reference}
        </div>
      )}
      <footer className="cell-foot">
        {state !== undefined && <code className="state" data-testid={`state-${id}`}>{state}</code>}
        {onStress && <Onyx.Button size="xs" variant="ghost" onClick={() => { log(title, "stress"); onStress(); }}>Stress</Onyx.Button>}
      </footer>
      {note && <p className="note">{note}</p>}
    </article>
  );
}

/** A control with its label beside it; the label is clickable. */
function Line({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="line">
      {children}
      <label htmlFor={id}>{label}{hint && <span className="hint">{hint}</span>}</label>
    </div>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void;
}) {
  return (
    <ToggleGroup type="single" aria-label={label} value={value} onValueChange={(v: string) => { if (v) onChange(v as T); }}>
      {options.map(([v, text]) => <ToggleGroupItem key={v} value={v}>{text}</ToggleGroupItem>)}
    </ToggleGroup>
  );
}

// ---- 1 · Choice ----
function SwitchCell() {
  const [autosave, setAutosave] = React.useState(true);
  const [sync, setSync] = React.useState(false);
  const [beta, setBeta] = React.useState(false);
  const stress = useStress(() => burst(9, 40, () => setSync((s) => !s)));
  return (
    <Cell id="switch" title="Switch" tag="role switch" state={`autosave=${on(autosave)} sync=${on(sync)} beta=${on(beta)}`} onStress={stress}
      note="The thumb stretches as it travels and squashes while pressed. Try holding the pointer down, dragging off before release, Space held down, and clicking the label."
      reference={<Onyx.Switch defaultChecked aria-label="Plain Onyx switch" />}>
      <Line id="sw-autosave" label="Auto save"><Switch id="sw-autosave" checked={autosave} onCheckedChange={(v) => { setAutosave(v); log("Switch", `Auto save → ${on(v)}`); }} /></Line>
      <Line id="sw-sync" label="Sync" hint="Stress flips it 9× in 360 ms"><Switch id="sw-sync" checked={sync} onCheckedChange={(v) => { setSync(v); log("Switch", `Sync → ${on(v)}`); }} /></Line>
      <Line id="sw-beta" label="Beta features"><Switch id="sw-beta" checked={beta} onCheckedChange={(v) => { setBeta(v); log("Switch", `Beta → ${on(v)}`); }} /></Line>
      <Line id="sw-managed" label="Managed by your organisation" hint="Disabled"><Switch id="sw-managed" defaultChecked disabled /></Line>
    </Cell>
  );
}

const LOCALES = ["English", "Français", "Deutsch"] as const;
function CheckboxCell() {
  const [sel, setSel] = React.useState<Record<string, boolean>>({ English: true, "Français": true, Deutsch: false });
  const count = LOCALES.filter((l) => sel[l]).length;
  const all: boolean | "mixed" = count === LOCALES.length ? true : count === 0 ? false : "mixed";
  const setAll = (v: boolean) => { setSel(Object.fromEntries(LOCALES.map((l) => [l, v]))); log("Checkbox", `All locales → ${v}`); };
  const stress = useStress(() => burst(9, 40, (i) => setSel((s) => ({ ...s, [LOCALES[i % 3]!]: !s[LOCALES[i % 3]!] }))));
  return (
    <Cell id="checkbox" title="Checkbox" tag="native input · mixed" state={`all=${String(all)} ${LOCALES.filter((l) => sel[l]).join(", ") || "none"}`} onStress={stress}
      note="The box pops, the check draws in, and the parent's check articulates into a dash when only some locales are on."
      reference={<span className="row"><Onyx.Checkbox defaultChecked aria-label="Plain checked" /><Onyx.Checkbox aria-checked="mixed" aria-label="Plain mixed" /><Onyx.Checkbox aria-label="Plain unchecked" /></span>}>
      <Line id="cb-all" label={`All locales (${count} of ${LOCALES.length})`}>
        <Checkbox id="cb-all" checked={all === true} aria-checked={all} onChange={(e) => setAll(e.currentTarget.checked)} />
      </Line>
      <div className="indent">
        {LOCALES.map((l) => (
          <Line key={l} id={`cb-${l}`} label={l}>
            <Checkbox id={`cb-${l}`} checked={!!sel[l]} onChange={(e) => { const v = e.currentTarget.checked; setSel((s) => ({ ...s, [l]: v })); log("Checkbox", `${l} → ${v}`); }} />
          </Line>
        ))}
      </div>
      <Line id="cb-locked" label="Managed" hint="Disabled, checked"><Checkbox id="cb-locked" disabled defaultChecked /></Line>
      <Line id="cb-locked-off" label="Unavailable" hint="Disabled"><Checkbox id="cb-locked-off" disabled /></Line>
    </Cell>
  );
}

function RadioCell() {
  const [mode, setMode] = React.useState("live");
  const [plan, setPlan] = React.useState("standard");
  const order = ["live", "manual"];
  const stress = useStress(() => burst(9, 40, (i) => setMode(order[i % 2]!)));
  return (
    <Cell id="radio-group" title="RadioGroup" tag="role radiogroup" state={`sync=${mode} plan=${plan}`} onStress={stress}
      note="Arrows move and select (Onyx's roving focus). The new dot grows in with a small overshoot while the old one shrinks."
      reference={<Onyx.RadioGroup aria-label="Plain sync" defaultValue="live"><Onyx.RadioGroupItem value="live">Live</Onyx.RadioGroupItem><Onyx.RadioGroupItem value="manual">Manual</Onyx.RadioGroupItem></Onyx.RadioGroup>}>
      <RadioGroup aria-label="Sync" value={mode} onValueChange={(v) => { setMode(v); log("RadioGroup", `Sync → ${v}`); }}>
        <RadioGroupItem value="live">Live: push changes to every client</RadioGroupItem>
        <RadioGroupItem value="manual">Manual: publish when you choose</RadioGroupItem>
        <RadioGroupItem value="paused" disabled>Paused (managed, disabled)</RadioGroupItem>
      </RadioGroup>
      <RadioGroup aria-label="Plan" variant="card" value={plan} onValueChange={(v) => { setPlan(v); log("RadioGroup", `Plan → ${v}`); }}>
        <RadioGroupItem value="standard">Standard</RadioGroupItem>
        <RadioGroupItem value="premium">Premium</RadioGroupItem>
      </RadioGroup>
    </Cell>
  );
}

function ToggleCell() {
  const [bold, setBold] = React.useState(true);
  const [italic, setItalic] = React.useState(false);
  const [preview, setPreview] = React.useState(false);
  const stress = useStress(() => burst(9, 40, () => setItalic((v) => !v)));
  return (
    <Cell id="toggle" title="Toggle" tag="aria-pressed" state={`bold=${on(bold)} italic=${on(italic)} preview=${on(preview)}`} onStress={stress}
      note="The pressed fill grows out from the centre as a circle and squashes on press; the icon and text stay Onyx's."
      reference={<span className="row"><Onyx.Toggle defaultPressed aria-label="Plain bold"><Onyx.Icon name="bold" /></Onyx.Toggle><Onyx.Toggle defaultPressed variant="outline">Preview</Onyx.Toggle></span>}>
      <div className="row">
        <Toggle aria-label="Bold" pressed={bold} onPressedChange={(v) => { setBold(v); log("Toggle", `Bold → ${on(v)}`); }}><Onyx.Icon name="bold" /></Toggle>
        <Toggle aria-label="Italic" pressed={italic} onPressedChange={(v) => { setItalic(v); log("Toggle", `Italic → ${on(v)}`); }}><Onyx.Icon name="italic" /></Toggle>
        <Toggle variant="outline" pressed={preview} onPressedChange={(v) => { setPreview(v); log("Toggle", `Preview → ${on(v)}`); }}><Onyx.Icon name="open-preview" /> Preview</Toggle>
        <Toggle disabled defaultPressed>Locked</Toggle>
      </div>
    </Cell>
  );
}

// ---- 2 · Actions ----
function PublishButton({ fail = false }: { fail?: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<"success" | "error">();
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button variant={fail ? "outline" : "default"} loading={loading} result={result} onClick={() => {
      setResult(undefined); setLoading(true); log("Button", `${fail ? "Publish (fails)" : "Publish"} → loading`);
      timer.current = setTimeout(() => { setLoading(false); setResult(fail ? "error" : "success"); log("Button", `${fail ? "Publish (fails)" : "Publish"} → ${fail ? "error" : "success"}`); }, 900);
    }}>
      <Onyx.Icon name="cloud-upload" /> {fail ? "Publish (fails)" : "Publish"}
    </Button>
  );
}
const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "md", "lg"] as const;
function ButtonCell() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<"success" | "error">();
  const [clicks, setClicks] = React.useState(0);
  const stress = useStress(() => burst(10, 60, (i) => setResult(i % 2 ? undefined : i % 4 ? "error" : "success")));
  return (
    <Cell id="button" title="Button" tag="idle · loading · success · error" wide
      state={`samples ${loading ? "loading" : "idle"} · result=${result ?? "none"} · clicks=${clicks}`} onStress={stress}
      note="Press squash; a loading arc in the foreground colour beside the label; a drawn check on success, a shake on error. The button keeps its width while loading: that is Onyx's rule, which also squeezes a short label to make room for the spinner (compare with plain Onyx beside)."
      reference={<span className="row">{(["default", "secondary", "outline"] as const).map((v) => <Onyx.Button key={v} variant={v} loading={loading}>{v}</Onyx.Button>)}</span>}>
      <div className="row"><PublishButton /><PublishButton fail /><Button disabled>Disabled</Button></div>
      <div className="row">
        {VARIANTS.map((v) => <Button key={v} variant={v} loading={loading} result={result} onClick={() => setClicks((c) => c + 1)}>{v}</Button>)}
      </div>
      <div className="row">
        {SIZES.map((s) => <Button key={s} size={s} variant="secondary" loading={loading} result={result} onClick={() => setClicks((c) => c + 1)}>Size {s}</Button>)}
        <Button size="icon" aria-label="Add" loading={loading} result={result} onClick={() => setClicks((c) => c + 1)}><Onyx.Icon name="add" /></Button>
        <Button size="icon-sm" aria-label="Add small" loading={loading} result={result} onClick={() => setClicks((c) => c + 1)}><Onyx.Icon name="add" /></Button>
      </div>
      <div className="row controls-row">
        <Line id="btn-loading" label="All loading"><Switch id="btn-loading" checked={loading} onCheckedChange={(v) => { setLoading(v); log("Button", `samples loading → ${on(v)}`); }} /></Line>
        <Seg label="Result for all" value={result ?? "none"} onChange={(v) => { setResult(v === "none" ? undefined : v); log("Button", `samples result → ${v}`); }}
          options={[["none", "No result"], ["success", "Success"], ["error", "Error"]] as const} />
      </div>
    </Cell>
  );
}

function SpinnerCell() {
  return (
    <Cell id="spinner" title="Spinner" tag="role status"
      note="An arc in the foreground colour, one turn every 700 ms (Onyx's timing). Reduced motion shows Onyx's own spinner."
      reference={<span className="row">{SIZES.map((s) => <Onyx.Spinner key={s} size={s} label={`Plain ${s}`} />)}</span>}>
      <div className="row">{SIZES.map((s) => <span key={s} className="row tight"><Spinner size={s} label={`Loading ${s}`} /><span className="muted">{s}</span></span>)}</div>
      <p className="row tight"><Spinner size="sm" label="Loading workspaces" /> Loading workspaces…</p>
    </Cell>
  );
}

function ProgressCell() {
  const [value, setValue] = React.useState(35);
  const [indeterminate, setIndeterminate] = React.useState(false);
  const stress = useStress(() => burst(16, 90, () => setValue(Math.round(Math.random() * 100))));
  return (
    <Cell id="progress" title="Progress" tag="role progressbar" state={`value=${indeterminate ? "indeterminate" : value}`} onStress={stress}
      note="The fill eases to Onyx's value in 240 ms, and retargets smoothly when the value changes mid-way. Stress jumps it 16 times."
      reference={<Onyx.Progress value={value} indeterminate={indeterminate} aria-label="Plain upload" />}>
      <div className="labelled"><span>Uploading notes.md</span><span className="num">{indeterminate ? "…" : `${value}%`}</span></div>
      <Progress value={value} indeterminate={indeterminate} aria-label="Upload" />
      <Slider aria-label="Progress value" value={[value]} onValueChange={(v) => setValue(v[0]!)} onValueCommit={(v) => log("Progress", `value → ${v[0]}`)} />
      <div className="row">
        {[0, 50, 100].map((v) => <Onyx.Button key={v} size="xs" variant="secondary" onClick={() => { setValue(v); log("Progress", `value → ${v}`); }}>{v}%</Onyx.Button>)}
        <Line id="pg-ind" label="Indeterminate"><Switch id="pg-ind" checked={indeterminate} onCheckedChange={(v) => { setIndeterminate(v); log("Progress", `indeterminate → ${on(v)}`); }} /></Line>
      </div>
      <div className="labelled"><span>Deploy (success tone)</span><span className="num">80%</span></div>
      <Progress value={80} tone="success" aria-label="Deploy" />
    </Cell>
  );
}

function MeterCell() {
  const [value, setValue] = React.useState(24);
  const tone = value >= 75 ? "high" : value >= 40 ? "medium" : "low";
  const stress = useStress(() => burst(12, 120, (i) => setValue([10, 50, 90][i % 3]!)));
  return (
    <Cell id="meter" title="Meter" tag="role meter · low 40 · high 75" state={`value=${value} (${tone})`} onStress={stress}
      note="The fill eases to the value; its tone cross-fades when the value crosses Onyx's low and high thresholds. Stress crosses both, 12 times."
      reference={<Onyx.Meter value={value} low={40} high={75} optimum={10} label="Plain CPU load" />}>
      <Meter value={value} low={40} high={75} optimum={10} label="CPU load" />
      <Slider aria-label="CPU load" value={[value]} onValueChange={(v) => setValue(v[0]!)} onValueCommit={(v) => log("Meter", `value → ${v[0]}`)} />
      <Meter value={62} max={100} low={40} high={75} optimum={10} label="Storage" />
      <Meter value={94} low={40} high={75} optimum={10} label="API quota" />
    </Cell>
  );
}

// ---- 3 · Indicators ----
const TABS = [["overview", "Overview"], ["activity", "Activity"], ["files", "Files"], ["locked", "Locked"]] as const;
function TabsCell() {
  const [tab, setTab] = React.useState("overview");
  const [long, setLong] = React.useState(false);
  const order = ["overview", "activity", "files"];
  const stress = useStress(() => burst(9, 45, (i) => setTab(order[i % 3]!)));
  const label = (v: string, text: string) => (v === "activity" && long ? "Activity (12 new changes)" : text);
  return (
    <Cell id="tabs" title="Tabs" tag="line · editor" wide state={`line=${tab} label=${long ? "long" : "short"}`} onStress={stress}
      note="The indicator travels to the selected tab with a leading-edge stretch, and follows the tab's measured width: rename a tab and it should resize. Arrows move focus; Enter or Space selects."
      reference={<Onyx.Tabs variant="line" defaultValue="overview"><Onyx.TabsList aria-label="Plain tabs">{TABS.map(([v, t]) => <Onyx.TabsTrigger key={v} value={v} disabled={v === "locked"}>{t}</Onyx.TabsTrigger>)}</Onyx.TabsList></Onyx.Tabs>}>
      <Tabs variant="line" value={tab} onValueChange={(v) => { setTab(v); log("Tabs", `line → ${v}`); }}>
        <TabsList aria-label="Workspace">
          {TABS.map(([v, t]) => <TabsTrigger key={v} value={v} disabled={v === "locked"}>{label(v, t)}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview"><p className="muted">Three clients connected, last sync 2 minutes ago.</p></TabsContent>
        <TabsContent value="activity"><p className="muted">Recent changes from your team.</p></TabsContent>
        <TabsContent value="files"><p className="muted">Documents attached to this project.</p></TabsContent>
      </Tabs>
      <Tabs value={tab} onValueChange={(v) => { setTab(v); log("Tabs", `editor → ${v}`); }}>
        <TabsList aria-label="Editor">
          {TABS.slice(0, 3).map(([v, t]) => <TabsTrigger key={v} value={v}>{label(v, t)}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="row">
        <Onyx.Button size="xs" variant="secondary" onClick={() => { const v = order[(order.indexOf(tab) + 1) % 3]!; setTab(v); log("Tabs", `next → ${v}`); }}>Next tab</Onyx.Button>
        <Onyx.Button size="xs" variant="secondary" onClick={() => { setLong((l) => !l); log("Tabs", `rename Activity → ${long ? "short" : "long"}`); }}>Rename “Activity”</Onyx.Button>
      </div>
    </Cell>
  );
}

function ToggleGroupCell() {
  const [view, setView] = React.useState("list");
  const [format, setFormat] = React.useState<string[]>(["bold"]);
  const [side, setSide] = React.useState("left");
  const order = ["list", "tree", "table"];
  const stress = useStress(() => burst(9, 45, (i) => setView(order[i % 3]!)));
  return (
    <Cell id="toggle-group" title="ToggleGroup" tag="single · multiple · vertical" state={`view=${view || "none"} format=[${format.join(",")}] side=${side || "none"}`} onStress={stress}
      note="Single selection: one pill travels and resizes between items (click the selected item to clear it). Multiple selection keeps Onyx's own backgrounds."
      reference={<Onyx.ToggleGroup type="single" defaultValue="list" aria-label="Plain view"><Onyx.ToggleGroupItem value="list">List</Onyx.ToggleGroupItem><Onyx.ToggleGroupItem value="tree">Tree</Onyx.ToggleGroupItem></Onyx.ToggleGroup>}>
      <ToggleGroup type="single" aria-label="View" value={view} onValueChange={(v: string) => { setView(v); log("ToggleGroup", `view → ${v || "none"}`); }}>
        <ToggleGroupItem value="list"><Onyx.Icon name="list-flat" /> List</ToggleGroupItem>
        <ToggleGroupItem value="tree"><Onyx.Icon name="list-tree" /> Tree</ToggleGroupItem>
        <ToggleGroupItem value="table"><Onyx.Icon name="table" /> Table</ToggleGroupItem>
        <ToggleGroupItem value="board" disabled>Board</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" aria-label="Formatting" value={format} onValueChange={(v: string[]) => { setFormat(v); log("ToggleGroup", `format → [${v.join(",")}]`); }}>
        <ToggleGroupItem value="bold" aria-label="Bold"><Onyx.Icon name="bold" /></ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic"><Onyx.Icon name="italic" /></ToggleGroupItem>
        <ToggleGroupItem value="code" aria-label="Code"><Onyx.Icon name="code" /></ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" orientation="vertical" aria-label="Sidebar side" value={side} onValueChange={(v: string) => { setSide(v); log("ToggleGroup", `side → ${v || "none"}`); }}>
        <ToggleGroupItem value="left">Sidebar left</ToggleGroupItem>
        <ToggleGroupItem value="right">Sidebar right</ToggleGroupItem>
        <ToggleGroupItem value="hidden">Hidden</ToggleGroupItem>
      </ToggleGroup>
    </Cell>
  );
}

const SECTIONS = [
  { value: "notes", label: "Notes", icon: "file" },
  { value: "activity", label: "Activity log", icon: "history" },
  { value: "files", label: "Project files", icon: "folder" },
  { value: "settings", label: "Settings", icon: "gear" },
];
function SectionSelectCell() {
  const [value, setValue] = React.useState("notes");
  return (
    <Cell id="section-select" title="SectionSelect" tag="listbox popup" state={`section=${value}`}
      note="Open it and move with the arrows or the pointer: the highlight travels between options. The check marks the committed value; Enter selects and closes, Escape closes."
      reference={<Onyx.SectionSelect value="notes" items={SECTIONS} onValueChange={() => {}} ariaLabel="Plain section" />}>
      <div className="row">
        <SectionSelect value={value} items={SECTIONS} onValueChange={(v: string) => { setValue(v); log("SectionSelect", `section → ${v}`); }} ariaLabel="Project section" />
        <Onyx.Button size="xs" variant="secondary" onClick={() => { setValue("files"); log("SectionSelect", "section → files (external)"); }}>Show files</Onyx.Button>
      </div>
    </Cell>
  );
}

// ---- 4 · Ranges and fields ----
function SliderCell() {
  const [volume, setVolume] = React.useState([35]);
  const [range, setRange] = React.useState([25, 75]);
  const [step, setStep] = React.useState([30]);
  const [vertical, setVertical] = React.useState([40]);
  const stress = useStress(() => burst(12, 70, () => setVolume([Math.round(Math.random() * 100)])));
  return (
    <Cell id="slider" title="Slider" tag="role slider" state={`volume=${volume[0]} range=${range.join("–")} step=${step[0]} vertical=${vertical[0]}`} onStress={stress}
      note="Onyx places the thumb; Anima squashes it while dragged and pops it on each keyboard step. Try Page Up/Down, Home/End, and dragging past the ends."
      reference={<Onyx.Slider aria-label="Plain volume" defaultValue={[35]} showValue />}>
      <div className="slider-row"><span>Volume</span><Slider aria-label="Volume" value={volume} onValueChange={setVolume} onValueCommit={(v) => log("Slider", `volume → ${v[0]}`)} showValue /></div>
      <div className="slider-row"><span>Price</span><Slider value={range} onValueChange={setRange} onValueCommit={(v) => log("Slider", `range → ${v.join("–")}`)} thumbLabels={["Minimum price", "Maximum price"]} showValue /></div>
      <div className="slider-row"><span>Steps of 10</span><Slider aria-label="Steps" step={10} value={step} onValueChange={setStep} onValueCommit={(v) => log("Slider", `step → ${v[0]}`)} showValue /></div>
      <div className="slider-row"><span>Locked</span><Slider aria-label="Locked" defaultValue={[45]} disabled showValue /></div>
      <div className="slider-row vertical"><span>Vertical</span><Slider aria-label="Vertical level" orientation="vertical" value={vertical} onValueChange={setVertical} onValueCommit={(v) => log("Slider", `vertical → ${v[0]}`)} showValue /></div>
    </Cell>
  );
}

function PasswordCell() {
  const [revealed, setRevealed] = React.useState(false);
  const [value, setValue] = React.useState("correct-horse");
  const stress = useStress(() => burst(9, 50, () => setRevealed((r) => !r)));
  return (
    <Cell id="password-field" title="PasswordField" tag="input + reveal toggle" state={`revealed=${revealed} length=${value.length}`} onStress={stress}
      note="Revealing blinks the eye while the slash draws away; hiding draws it back. The input and the toggle button are Onyx's."
      reference={<Onyx.PasswordField defaultValue="correct-horse" aria-label="Plain password" />}>
      <div className="field"><label htmlFor="pw-main">Password</label>
        <PasswordField id="pw-main" value={value} onChange={(e) => setValue(e.currentTarget.value)} revealed={revealed} onRevealedChange={(v) => { setRevealed(v); log("PasswordField", `revealed → ${v}`); }} />
      </div>
      <div className="field"><label htmlFor="pw-empty">Empty</label><PasswordField id="pw-empty" placeholder="Enter a password" /></div>
      <div className="field"><label htmlFor="pw-locked">Disabled</label><PasswordField id="pw-locked" defaultValue="locked" disabled /></div>
    </Cell>
  );
}

// ---- 5 · Disclosure and feedback ----
function CollapsibleCell() {
  const [open, setOpen] = React.useState(true);
  const stress = useStress(() => burst(9, 45, () => setOpen((o) => !o)));
  return (
    <Cell id="collapsible" title="Collapsible" tag="aria-expanded" state={`details=${open ? "open" : "closed"}`} onStress={stress}
      note="The chevron turns with a small overshoot; the content keeps Onyx's height animation."
      reference={<Onyx.Collapsible defaultOpen><Onyx.CollapsibleTrigger>Plain details</Onyx.CollapsibleTrigger><Onyx.CollapsibleContent>Onyx's own chevron.</Onyx.CollapsibleContent></Onyx.Collapsible>}>
      <Collapsible open={open} onOpenChange={(v) => { setOpen(v); log("Collapsible", `details → ${v ? "open" : "closed"}`); }}>
        <CollapsibleTrigger>Project details</CollapsibleTrigger>
        <CollapsibleContent><p className="muted">notes.bedrock.dev · 3 servers · last deploy 2 hours ago.</p></CollapsibleContent>
      </Collapsible>
      <Collapsible><CollapsibleTrigger>Advanced</CollapsibleTrigger><CollapsibleContent><p className="muted">Nothing here yet.</p></CollapsibleContent></Collapsible>
      <Collapsible disabled defaultOpen><CollapsibleTrigger>Managed (disabled)</CollapsibleTrigger><CollapsibleContent><p className="muted">Set by your organisation.</p></CollapsibleContent></Collapsible>
    </Cell>
  );
}

function AccordionCell() {
  const [single, setSingle] = React.useState("general");
  const [multi, setMulti] = React.useState<string[]>(["files"]);
  const order = ["general", "advanced", ""];
  const stress = useStress(() => burst(9, 45, (i) => setSingle(order[i % 3]!)));
  const item = (value: string, title: string, disabled = false) => (
    <AccordionItem key={value} value={value} disabled={disabled}>
      <AccordionHeader><AccordionTrigger meta={disabled ? "Locked" : undefined}>{title}</AccordionTrigger></AccordionHeader>
      <AccordionContent><p className="muted">Settings for {title.toLowerCase()}.</p></AccordionContent>
    </AccordionItem>
  );
  return (
    <Cell id="accordion" title="Accordion" tag="single · multiple" state={`single=${single || "none"} multiple=[${multi.join(",")}]`} onStress={stress}
      note="One chevron per item. In the single accordion, opening one item turns the other's chevron back at the same time."
      reference={<Onyx.Accordion type="single" collapsible defaultValue="a"><Onyx.AccordionItem value="a"><Onyx.AccordionHeader><Onyx.AccordionTrigger>Plain item</Onyx.AccordionTrigger></Onyx.AccordionHeader><Onyx.AccordionContent>Onyx's chevron.</Onyx.AccordionContent></Onyx.AccordionItem></Onyx.Accordion>}>
      <Accordion type="single" collapsible value={single} onValueChange={(v: string) => { setSingle(v); log("Accordion", `single → ${v || "none"}`); }} aria-label="Settings">
        {item("general", "General")}{item("locked", "Managed", true)}{item("advanced", "Advanced")}
      </Accordion>
      <Accordion type="multiple" value={multi} onValueChange={(v: string[]) => { setMulti(v); log("Accordion", `multiple → [${v.join(",")}]`); }} aria-label="Data">
        {item("files", "Files")}{item("history", "History")}
      </Accordion>
    </Cell>
  );
}

const TONES = ["neutral", "info", "success", "warning", "danger"] as const;
function ToastControls() {
  const queue = useToast();
  const latest = queue.toasts.at(-1);
  const stress = useStress(() => burst(6, 80, (i) => queue.toast({ title: `Burst ${i + 1}`, tone: TONES[i % 5], duration: 1500 })));
  return (
    <Cell id="toast" title="Toast" tag="queue · live region" state={`${queue.toasts.length} open${latest ? ` · latest ${latest.tone ?? "neutral"}` : ""}`} onStress={stress}
      note="The tone icon draws in when a toast appears or changes tone. Toasts stack bottom-right; hover or focus pauses timed ones. Stress raises 6 in half a second."
      reference={<Onyx.ToastRoot tone="success" style={{ transform: "none" }}><Onyx.ToastIcon><Onyx.Icon name="pass" /></Onyx.ToastIcon><Onyx.ToastMessage>Plain Onyx toast</Onyx.ToastMessage></Onyx.ToastRoot>}>
      <div className="row">
        {TONES.map((tone) => <Onyx.Button key={tone} size="xs" variant="secondary" onClick={() => { queue.toast({ title: `Published fr.json`, description: `${tone} · 3 servers updated`, tone, duration: 0 }); log("Toast", `raise ${tone}`); }}>{tone}</Onyx.Button>)}
      </div>
      <div className="row">
        <Onyx.Button size="xs" variant="secondary" onClick={() => { queue.toast({ title: "Saved", tone: "success", duration: 2000 }); log("Toast", "raise timed (2 s)"); }}>Timed, 2 s</Onyx.Button>
        <Onyx.Button size="xs" variant="secondary" disabled={!latest} onClick={() => { if (!latest) return; const tone = latest.tone === "success" ? "danger" : "success"; queue.update(latest.id, { tone, title: `Updated to ${tone}` }); log("Toast", `update latest → ${tone}`); }}>Change latest tone</Onyx.Button>
        <Onyx.Button size="xs" variant="ghost" onClick={() => { queue.dismiss(); log("Toast", "dismiss all"); }}>Dismiss all</Onyx.Button>
      </div>
    </Cell>
  );
}

function AlertCell() {
  const [tone, setTone] = React.useState<"info" | "success">("info");
  const [shown, setShown] = React.useState(true);
  const [mount, remount] = React.useReducer((n: number) => n + 1, 0);
  const stress = useStress(() => burst(8, 70, () => setTone((t) => (t === "info" ? "success" : "info"))));
  return (
    <Cell id="alert" title="Alert" tag="role alert · status" wide state={`tone=${tone} dismissible=${shown ? "shown" : "dismissed"} mounts=${mount + 1}`} onStress={stress}
      note="Each tone icon draws in once when the alert mounts, and again when its tone changes. Remount draws them all again."
      reference={<Onyx.Alert tone="success" title="Plain Onyx alert" description="Onyx's own icon." />}>
      <div className="alerts" key={mount}>
        {TONES.map((t) => <Alert key={t} tone={t} title={`${t[0]!.toUpperCase()}${t.slice(1)}`} description="Your project stays in sync." />)}
        <Alert tone={tone} title="Changing tone" description="Use the button below." />
        {shown && <Alert tone="warning" title="Dismissible" description="Close it, then bring it back." dismissible onDismiss={() => { setShown(false); log("Alert", "dismissed"); }} />}
      </div>
      <div className="row">
        <Onyx.Button size="xs" variant="secondary" onClick={() => { setTone((t) => (t === "info" ? "success" : "info")); log("Alert", "change tone"); }}>Change tone</Onyx.Button>
        <Onyx.Button size="xs" variant="secondary" disabled={shown} onClick={() => { setShown(true); log("Alert", "bring back"); }}>Bring back</Onyx.Button>
        <Onyx.Button size="xs" variant="secondary" onClick={() => { remount(); log("Alert", "remount all"); }}>Remount all</Onyx.Button>
      </div>
    </Cell>
  );
}

// ---- 6 · Events ----
function EventsCell() {
  const list = React.useSyncExternalStore(subscribeLog, () => entries);
  const t0 = list.at(-1)?.at ?? 0;
  return (
    <Cell id="events" title="Event log" tag="onChange callbacks, newest first" wide
      note="Every change a component reports. A doubled or missing entry, or a state readout that disagrees with what is drawn, is a bug.">
      <div className="row">
        <Onyx.Button size="sm" onClick={() => { log("Page", `stress everything (${stressers.size} cells)`); stressers.forEach((s) => s()); }}>Stress everything</Onyx.Button>
        <Onyx.Button size="sm" variant="ghost" onClick={() => { entries = []; emit(); }}>Clear</Onyx.Button>
      </div>
      <ol className="events" aria-live="off">
        {list.length === 0 && <li className="muted empty">Nothing yet. Use any control above.</li>}
        {list.map((e) => (
          <li key={e.id}><span className="num">+{((e.at - t0) / 1000).toFixed(2)} s</span><span className="src">{e.source}</span><span>{e.text}</span></li>
        ))}
      </ol>
    </Cell>
  );
}

// ---- the page ----
function useParts() {
  const [parts, setParts] = React.useState({ ready: 0, all: 0 });
  React.useEffect(() => {
    const t = setInterval(() => setParts({
      ready: document.querySelectorAll("[data-golem-part][data-anima='ready']").length,
      all: document.querySelectorAll("[data-golem-part]").length,
    }), 400);
    return () => clearInterval(t);
  }, []);
  return parts;
}

function StatusLine() {
  const runtime = React.useSyncExternalStore(onRuntimeState, runtimeState);
  const { motion } = useGolem();
  const parts = useParts();
  const toggled = new URLSearchParams(location.search);
  if (ANIMA_OFF) toggled.delete("anima"); else toggled.set("anima", "off");
  return (
    <p className="status" data-testid="status">
      <span>Anima runtime <b data-testid="runtime">{ANIMA_OFF ? "off" : runtime}</b></span>
      <span>Motion <b data-testid="motion">{motion}</b></span>
      <span>Motion parts drawn by Anima <b data-testid="parts">{parts.ready} of {parts.all}</b></span>
      <a href={`?${toggled}`}>{ANIMA_OFF ? "Reload with Anima" : "Reload without Anima (the fallback)"}</a>
    </p>
  );
}

type Density = "compact" | "comfortable";
function App() {
  const [theme, setTheme] = React.useState(params.get("theme") ?? "dark");
  const [motion, setMotion] = React.useState<MotionSetting>((params.get("motion") as MotionSetting) ?? "anima");
  const [density, setDensity] = React.useState<Density>((params.get("density") as Density) ?? "compact");
  const [plain, setPlain] = React.useState(params.get("plain") === "1");
  React.useLayoutEffect(() => { document.documentElement.dataset.density = density; }, [density]);
  // Keep the settings in the URL, so a bug report can be a link.
  React.useEffect(() => {
    const p = new URLSearchParams(location.search);
    p.set("theme", theme); p.set("motion", motion); p.set("density", density);
    if (plain) p.set("plain", "1"); else p.delete("plain");
    history.replaceState(null, "", `?${p}`);
  }, [theme, motion, density, plain]);
  return (
    <GolemProvider theme={theme} motion={motion} anima={ANIMA}>
      <ToastProvider maxVisible={5} label="Playground notifications">
        <PlainContext.Provider value={plain}>
          <header className="bar">
            <h1>Golem <span>playground</span></h1>
            <div className="bar-controls">
              <Seg label="Motion" value={motion} onChange={(v) => { setMotion(v); log("Page", `motion → ${v}`); }}
                options={[["anima", "Anima"], ["css", "Onyx"], ["reduced", "Reduced"], ["system", "System"]] as const} />
              <Seg label="Theme" value={theme} onChange={(v) => { setTheme(v); log("Page", `theme → ${v}`); }}
                options={Object.values(themes).map((t) => [t.name, t.label] as const)} />
              <Seg label="Density" value={density} onChange={(v) => { setDensity(v); log("Page", `density → ${v}`); }}
                options={[["compact", "Compact"], ["comfortable", "Comfortable"]] as const} />
              <span className="line"><Switch id="plain" checked={plain} onCheckedChange={(v) => { setPlain(v); log("Page", `plain Onyx beside → ${on(v)}`); }} /><label htmlFor="plain">Plain Onyx beside</label></span>
            </div>
          </header>
          <main className="page onyx-theme-root">
            <section className="intro">
              <p>Every Golem component, live. Each is an Onyx primitive: Onyx owns roles, focus, keyboard and state, and
                an Anima drawing adds the motion. With motion set to Onyx or Reduced, or without Anima, you get plain Onyx.
                Each card shows its current state and has a <b>Stress</b> button that fires rapid changes; every change lands in
                the event log at the bottom. The settings are kept in the address, so a link reproduces what you saw.</p>
              <StatusLine />
            </section>
            <Group n={1} id="choice" title="Choice"><SwitchCell /><CheckboxCell /><RadioCell /><ToggleCell /></Group>
            <Group n={2} id="actions" title="Actions and feedback"><ButtonCell /><SpinnerCell /><ProgressCell /><MeterCell /></Group>
            <Group n={3} id="indicators" title="Indicators"><TabsCell /><ToggleGroupCell /><SectionSelectCell /></Group>
            <Group n={4} id="ranges" title="Ranges and fields"><SliderCell /><PasswordCell /></Group>
            <Group n={5} id="disclosure" title="Disclosure and notices"><CollapsibleCell /><AccordionCell /><ToastControls /><AlertCell /></Group>
            <Group n={6} id="events" title="Events"><EventsCell /></Group>
            <footer className="foot">Golem · MIT · <a href="https://github.com/MRoiban/golem">github.com/MRoiban/golem</a> · Onyx and Anima by MRoiban · Codicons © Microsoft, CC BY 4.0</footer>
          </main>
        </PlainContext.Provider>
      </ToastProvider>
    </GolemProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
