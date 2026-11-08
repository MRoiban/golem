import * as React from "react";
import { PasswordField as OnyxPasswordField } from "@mroiban/onyx";
import { PasswordField } from "@mroiban/golem";
import { Section } from "../ui";

const row: React.CSSProperties = { display: "grid", gap: 8, padding: "12px 0" };
export default function PasswordFieldSection() {
  const [revealed, setRevealed] = React.useState(false);
  return <Section id="password-field" title="PasswordField" description="Anima closes the eye and draws its slash when Onyx reveals the password. The input and toggle stay Onyx's.">
    <div style={row}><label htmlFor="password-empty">Empty password</label><PasswordField id="password-empty" placeholder="Enter a password" data-testid="empty" /></div>
    <div style={row}><label htmlFor="password-filled">Filled password</label><PasswordField id="password-filled" defaultValue="correct-horse" data-testid="filled" /></div>
    <form style={row} onSubmit={(e) => e.preventDefault()}><label htmlFor="password-revealed">Initially revealed</label><PasswordField id="password-revealed" name="password" defaultValue="morning-light" defaultRevealed data-testid="revealed" /><button type="reset">Reset revealed password</button></form>
    <div style={row}><label htmlFor="password-controlled">Controlled visibility · {revealed ? "shown" : "hidden"}</label><PasswordField id="password-controlled" defaultValue="silver-leaf" revealed={revealed} onRevealedChange={setRevealed} data-testid="controlled" /><button type="button" onClick={() => setRevealed((v) => !v)}>Change visibility</button></div>
    <div style={row}><label htmlFor="password-disabled">Disabled password</label><PasswordField id="password-disabled" defaultValue="locked" disabled data-testid="disabled" /></div>
    <div style={row}><label htmlFor="password-plain">Plain Onyx (reference)</label><OnyxPasswordField id="password-plain" defaultValue="correct-horse" data-testid="plain" /></div>
  </Section>;
}
