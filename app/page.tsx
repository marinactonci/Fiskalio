import { Audience } from "./_landing/Audience";
import { Automation } from "./_landing/Automation";
import { Faq } from "./_landing/Faq";
import { FinalCta } from "./_landing/FinalCta";
import { Hero } from "./_landing/Hero";
import { HowItWorks } from "./_landing/HowItWorks";
import { LandingFooter } from "./_landing/LandingFooter";
import { LandingHeader } from "./_landing/LandingHeader";
import { Views } from "./_landing/Views";
import { WhatItIsNot } from "./_landing/WhatItIsNot";

export default function LandingPage() {
  return (
    // overflow-x-clip: the tilted receipt and its stamp poke past the gutter on phones
    <div className="min-h-screen overflow-x-clip bg-paper text-ink">
      <LandingHeader />
      <main>
        <Hero />
        <Audience />
        <HowItWorks />
        <Automation />
        <Views />
        <WhatItIsNot />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
