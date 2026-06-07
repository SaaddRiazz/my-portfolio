'use client';

import React from 'react';
import GumballSkills from './GumballMachine'

interface SkillBubble {
  name: string;
  icon: React.ReactNode; 
  colorShift?: boolean;
}

export default function AboutSection() {
  return (
    <section id="about" className="about-section">
      <div className="about-wrapper">
        
        {/* Centered Top Heading */}
        <div className="about-header">
          <h2>About</h2>
        </div>

        {/* Bottom Content Area */}
        <div className="about-content">
          {/* Left Side: Biographical Text Block */}
          <div className="about-intro">
            <p>
              Hello! I&apos;m Saad, a multi-disciplinary developer who thrives at the intersection of logical engineering and interactive design. Whether structuring complex web ecosystems or bringing virtual worlds to life in game engines, I focus on building responsive, performant architectures.
            </p>
            <p>
              I have a deep passion for game development because of the endless opportunities to discover new things and build something unique. If you got the vision, I got the code. Let's make it real.
            </p>
          </div>

          {/* Right Side: Triple Centered Column Structure Container */}
          <div className="skills-grid-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',   // ← centers canvas + grid horizontally
            justifyContent: 'center',
            width: '100%',
          }}>
            <GumballSkills />       {/* replace ModelViewer with your new component */}
          </div>
        </div>

      </div>
    </section>
  );
}