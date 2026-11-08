// Progressive mounting. Mounting every control at once blocked anima-kit's page for ~5.6 s, so
// mounts are queued and run a few per frame, visible controls first; the plain Onyx control is
// already on screen, so waiting never shows an empty box.
type Job = { el: Element; run: () => void | Promise<void>; visible: boolean; done: boolean };

const queue: Job[] = [];
let scheduled = false;
const FRAME_BUDGET_MS = 6;
let io: IntersectionObserver | null = null;
const jobsByEl = new Map<Element, Job>();

function observer() {
  if (!io && typeof IntersectionObserver !== "undefined")
    io = new IntersectionObserver((entries) => {
      for (const e of entries) { const j = jobsByEl.get(e.target); if (j) j.visible = e.isIntersecting; }
    }, { rootMargin: "200px" });
  return io;
}

function pump() {
  scheduled = false;
  const start = performance.now();
  while (queue.length && performance.now() - start < FRAME_BUDGET_MS) {
    // Visible first, then document order.
    let i = queue.findIndex((j) => j.visible);
    if (i < 0) i = 0;
    const [job] = queue.splice(i, 1);
    if (!job || job.done) continue;
    job.done = true;
    jobsByEl.delete(job.el);
    io?.unobserve(job.el);
    void job.run();
  }
  if (queue.length) schedule();
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => setTimeout(pump, 0));
}

/** Queue `run` for `el`; returns a cancel function. */
export function enqueueMount(el: Element, run: () => void | Promise<void>): () => void {
  const job: Job = { el, run, visible: false, done: false };
  queue.push(job);
  jobsByEl.set(el, job);
  observer()?.observe(el);
  schedule();
  return () => {
    job.done = true;
    jobsByEl.delete(el);
    io?.unobserve(el);
    const i = queue.indexOf(job);
    if (i >= 0) queue.splice(i, 1);
  };
}
export const pendingMounts = () => queue.length;
