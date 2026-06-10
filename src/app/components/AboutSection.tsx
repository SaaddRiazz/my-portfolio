'use client';

import React from 'react';
import '../styles/about.css';
import { ClawMachineProvider, ClawMachine, SkillsGrid, ClawMachineToast } from './ClawMachineMain';

export default function AboutSection() {
  return (
    <ClawMachineProvider>
      <section id="about" className="about-section">
        <div className="about-wrapper">
          <div className="about-header">
            <h2>About</h2>
          </div>
          <div className="about-content">
            <div className="about-intro">
              <p className="skills-label">Who I am</p>
              <h3 className="about-intro-heading">
                Building at the edge of <span>code &amp; creativity</span>
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
            </div>
            <div className="skills-grid-container">
              <ClawMachine />
            </div>
            <div className="skills-wrapper-container">
              <p className="skills-label">Skills</p>
              <SkillsGrid />
            </div>
          </div>
        </div>
      </section>
      <ClawMachineToast />
    </ClawMachineProvider>
  );
}