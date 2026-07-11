import { Navbar } from "./components/layout/Navbar"
import { Footer } from "./components/layout/Footer"
import { CustomCursor } from "./components/ui/CustomCursor"
import { Hero } from "./components/sections/Hero"
import { Logos } from "./components/sections/Logos"
import { Problem } from "./components/sections/Problem"
import { Solution } from "./components/sections/Solution"
import { HowItWorks } from "./components/sections/HowItWorks"
import { Comparison } from "./components/sections/Comparison"
import { Testimonials } from "./components/sections/Testimonials"
import { Pricing } from "./components/sections/Pricing"
import { FAQ } from "./components/sections/FAQ"
import { CTA } from "./components/sections/CTA"

export default function App() {
  return (
    <div className="min-h-screen bg-rh-navy text-rh-white antialiased">
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <Problem />
        <Solution />
        <HowItWorks />
        <Comparison />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
