import Experience from "@/components/Experience";
import HeroSection from "@/components/HeroSection";
import TrainingSection from "@/components/TrainingSection";
import AITeaser from "@/components/AITeaser";
import StoreSection from "@/components/StoreSection";

export default function HomePage() {
  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden">
        <Experience />
      </div>
      <HeroSection />
      <TrainingSection />
      <AITeaser />
      <StoreSection />
    </>
  );
}
