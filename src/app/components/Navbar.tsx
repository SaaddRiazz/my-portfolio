// components/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import '../styles/navbar.css';

const navLinks = [
  { label: 'Home',     href: '#home'     },
  { label: 'About',    href: '#about'    },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact',  href: '#contact'  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [activeLink, setActiveLink] = useState('#home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map(l => document.querySelector(l.href))
      .filter(Boolean) as Element[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveLink('#' + entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>

      {/* Logo — brackets instead of angle brackets to avoid SSR/client mismatch */}
      <a href="#home" className="navbar-logo" onClick={closeMenu}>
        <span className="logo-bracket">&lt;/</span>
        <span className="logo-accent">Saad</span>
        <span className="logo-bracket">&gt;</span>
      </a>

      {/* Hamburger toggle */}
      <button
        className={`navbar-toggle${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Nav links */}
      <ul className={`navbar-links${menuOpen ? ' open' : ''}`}>
        {navLinks.map(link => (
          <li key={link.href}>
            <a
              href={link.href}
              className={activeLink === link.href ? 'active' : ''}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <a href="mailto:you@example.com" className="navbar-cta" onClick={closeMenu}>
            Hire Me
          </a>
        </li>
      </ul>

    </nav>
  );
}