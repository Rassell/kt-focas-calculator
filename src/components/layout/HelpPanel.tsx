export function HelpPanel() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 py-4 bg-[#f8f9ff] border-b border-[#e2e6f0] text-[13px] text-[#334155] w-full box-border">
      <h3 className="m-0 mb-2 text-sm font-semibold text-[#0f172a]">How it works</h3>
      <p>Set your ballistic skill / weapon skill, attacks, weapon rules, and cover, then read the chance of damage and kills. Starred items have hovertext. Geared ⚙️ items are advanced — tick Advanced to show them.</p>
      <ul className="mt-2 pl-[18px] list-disc space-y-1">
        <li><strong>Balanced</strong> rerolls 1 die. <strong>Relentless</strong> rerolls fails. <strong>Ceaseless</strong> rerolls 1s.</li>
        <li><strong>Rending:</strong> if ≥1 crit, retain a normal as crit. <strong>Severe:</strong> if no crits, change a normal to crit.</li>
        <li><strong>Obscured:</strong> attacker crits are retained as normals.</li>
        <li><strong>Cover Saves:</strong> auto-retained saves. <strong>JaS:</strong> Just a Scratch — ignore one hit.</li>
        <li><strong>Devastating:</strong> MW per crit (unsavable). <strong>Piercing:</strong> worsens save by AP.</li>
      </ul>
    </div>
  )
}
