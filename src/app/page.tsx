import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Navbar />
      <main>
        <AboutSection />
        {/* Future sections like <ProjectsSection /> and <ContactSection /> will go here */}
      </main>
    </>
  );
}