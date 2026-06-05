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
    <section id="home" className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />

      <div className="hero-content">
        {/* Animated Headline: Arrives from the left */}
        <h1 className="animate-slide-left">
          Hello, I&apos;m <span className="name">Saad</span>.
        </h1>

        {/* Animated Subtitle: Arrives from the right */}
        <p className="subtitle animate-slide-right">
          <Typewriter words={roles} startDelay={1300} />
        </p>

        {/* Animated Action Button: Pauses, then drifts subtly upwards from down */}
        <a href="#about" className="view-work-btn animate-fade-up">
          View my work <span className="arrow">↓</span>
        </a>
      </div>

      {/* Embedded Component Stylesheet to govern choreographic timings */}
      <style>{`
        /* 1. Name Heading: Enters from Left (-50px) */
        .animate-slide-left {
          opacity: 0;
          transform: translateX(-100px);
          animation: slideIn 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* 2. Subtitle Descriptor: Enters from Right (+50px) */
        .animate-slide-right {
          opacity: 0;
          transform: translateX(100px);
          animation: slideIn 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Shared motion formula for text tracks */
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* 3. CTA Button: Drifts safely upwards from a 25px container threshold */
        .animate-fade-up {
          opacity: 0;
          transform: translateY(25px);
          animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 1.1s; /* Waits perfectly for headers to finish snapping */
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}