export default function Footer() {
  return (
    <footer className="animate-fade-in-up mx-auto max-w-2xl px-4 py-8 text-center text-xs leading-relaxed text-slate-500" style={{ animationDelay: '0.7s' }}>
      <p className="mb-2 font-semibold text-slate-400">What is ensemble forecasting?</p>
      <p>
        No single weather model is always right. Ensemble forecasting runs the same atmospheric
        equations through multiple independent models — each with different assumptions, resolutions,
        and data assimilation techniques. Where models agree, confidence is high. Where they diverge,
        uncertainty increases. By comparing ECMWF, GFS, ICON, Météo-France, and the UK Met Office
        together, you get a richer picture of what the weather might actually do.
      </p>
      <p className="mt-3 text-slate-600">
        Data from <a href="https://open-meteo.com" className="underline hover:text-slate-400" target="_blank" rel="noopener noreferrer">Open-Meteo</a> — free weather API.
      </p>
    </footer>
  )
}
