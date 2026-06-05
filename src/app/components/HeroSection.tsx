import ParticleCanvas from './ParticleCanvas';
import Typewriter from './Typewriter';

export default function HeroSection() {
  const roles = [
    'Software Engineer.',
    'Game Developer.',
    'Web Developer.',
    'Android App Developer.',
    'AI Engineer.',
  ];

  return (
    <section id="home" className="hero">
      <ParticleCanvas />
      <div className="hero-content">
        <h1>
          Hello, I&apos;m <span className="name">Saad</span>.
        </h1>
        <p className="subtitle">
          <Typewriter words={roles} />
        </p>
        <a href="#about" className="view-work-btn">
          View my work <span className="arrow">↓</span>
        </a>
      </div>
    </section>
  );
}