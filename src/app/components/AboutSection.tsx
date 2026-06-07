'use client';

import React from 'react';
import '../styles/about.css';
import GumballSkills from './GumballMachine';

export default function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="about-wrapper">

        {/* Page heading */}
        <div className="about-header">
          <h2>About</h2>
        </div>

        <div className="about-content">

          {/* grid-area: bio — top-left on desktop, first on mobile */}
          <div className="about-intro">

            <p className="skills-label">Who I am</p>
            <h3 className="about-intro-heading">
              Building at the edge of <span>code & creativity</span>
            </h3>

            <p>
              Hello! I&apos;m Saad, a <strong>multi-disciplinary developer</strong> who thrives
              at the intersection of logical engineering and interactive design. Whether
              structuring complex web ecosystems or bringing virtual worlds to life in
              game engines, I focus on building responsive,{' '}
              <strong>performant architectures</strong>.
            </p>

            <p className="callout">
              I have a deep passion for game development — the endless opportunity to
              discover, build, and ship something truly unique. If you got the vision,{' '}
              <strong>I got the code</strong>. Let&apos;s make it real.
            </p>

            <p className="skills-label">Skills — click the crank to reveal</p>

          </div>

          {/* grid-area: machine — right column on desktop, second on mobile */}
          <div className="skills-grid-container">
            <GumballSkills />
          </div>

          {/* NOTE: The skills-grid div is rendered inside GumballSkills and already
              carries className="skills-grid". On desktop it sits in grid-area: skills
              (bottom-left). On mobile it appears below the machine. The GumballSkills
              component renders the canvas + status + unlock button + skills-grid all
              inside .gumball-skills-container which lives in the machine grid area.
              If you want the skills-grid to break out of the machine area on desktop,
              extract it from GumballSkills into a separate slot here and pass
              unlocked/skillColors/justUnlocked as props. */}

        </div>
      </div>
    </section>
  );
}