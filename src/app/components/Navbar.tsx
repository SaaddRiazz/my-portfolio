'use client';

import { useEffect, useState } from 'react';

export default function Navbar() {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar once we scroll past the hero section (about 70% viewport height)
      const scrollY = window.scrollY;
      const triggerPoint = window.innerHeight * 0.7;

      setVisible(scrollY > triggerPoint);

      // Determine active section based on scroll position
      const sections = ['home', 'about', 'projects', 'contact'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${visible ? 'visible' : ''}`}>
      <ul className="navbar-links">
        {['Home', 'About', 'Projects', 'Contact'].map((item) => {
          const id = item.toLowerCase();
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={activeSection === id ? 'active' : ''}
                onClick={(e) => handleClick(e, id)}
              >
                {item}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
