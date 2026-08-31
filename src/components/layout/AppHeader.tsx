import focaLogo from '../../assets/foca.png'

export function AppHeader() {
  return (
      <header className="bg-[#0f1117] text-[#e8e8ef] border-b border-[#2a2d3a]">
        <div className="max-w-[1280px] mx-auto px-5 py-3.5 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex gap-3 items-center">
            <img
              src={focaLogo}
              alt="KT FOCAS Calculator Logo"
              className="h-8 w-8"
            />
            <div>
              <h1 className="m-0 text-[20px] text-red tracking-[-0.5px] font-semibold">KT FOCAS Calculator</h1>
              <p className="mt-0.5 text-xs text-[#9aa0b5]">Kill Team 2026 Calculator — work out the odds</p>
            </div>
          </div>
        </div>
      </header>
  )
}
