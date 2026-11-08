import * as React from "react";
import { onSystemMotionChange, resolveMotion, systemPrefersReduced, type Motion, type MotionSetting } from "./motion";
import { configureAnima, type AnimaConfig } from "./runtime";
import { onDocumentThemeChange } from "./theme";

export type GolemContextValue = {
  /** Golem theme name (a @golem/tokens theme), written to <html data-theme>. */
  theme: string;
  motion: Motion;
  /** Bumped whenever document theme attributes or variables change. */
  themeVersion: number;
};
const GolemContext = React.createContext<GolemContextValue>({ theme: "dark", motion: "css", themeVersion: 0 });
export const useGolem = () => React.useContext(GolemContext);

export type GolemProviderProps = {
  theme?: string;
  motion?: MotionSetting;
  /** Where the Anima runtime and scenes are served. Omit (or runtime: null) for plain Onyx. */
  anima?: Partial<AnimaConfig>;
  /** Write data-theme / data-golem-motion on <html> (default true; needed for body portals). */
  document?: boolean;
  children?: React.ReactNode;
};

export function GolemProvider({ theme = "dark", motion: setting = "system", anima, document: onDocument = true, children }: GolemProviderProps) {
  // Configure before children mount (their effects run before ours).
  React.useMemo(() => { if (anima) configureAnima(anima); }, [anima?.runtime, anima?.scenes]);
  const [reduced, setReduced] = React.useState(systemPrefersReduced);
  React.useEffect(() => onSystemMotionChange(() => setReduced(systemPrefersReduced())), []);
  const motion = resolveMotion(setting, reduced);
  const [themeVersion, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => onDocumentThemeChange(bump), []);
  React.useLayoutEffect(() => {
    if (!onDocument) return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.golemMotion = motion;
  }, [theme, motion, onDocument]);
  const value = React.useMemo(() => ({ theme, motion, themeVersion }), [theme, motion, themeVersion]);
  return <GolemContext.Provider value={value}>{children}</GolemContext.Provider>;
}
