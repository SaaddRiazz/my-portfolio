'use client';

import React from 'react';

interface SkillBubble {
  name: string;
  icon: React.ReactNode; 
  colorShift?: boolean;
}

export default function AboutSection() {
  const skills: SkillBubble[] = [
    { 
      name: 'Unity', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg" />
    },
    { 
      name: 'React', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
    },
    { 
      name: 'Python', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" />
    },
    { 
      name: 'TypeScript', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" />
    },
    { 
      name: 'Node.js', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" />
    },
    { 
      name: 'Next.js', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" />
    },
    { 
      name: 'C#', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg" />
    },
    { 
      name: 'Java', 
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" />
    },
    {
      name: 'Blender',
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/blender/blender-original.svg" />
    },
    {
      name: 'Git',
      icon: <img width={50} src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" />
    }
  ];

  // Distribute exactly: 3 left, 4 middle, 3 right
  const leftColumn = skills.slice(0, 3);
  const middleColumn = skills.slice(3, 7);
  const rightColumn = skills.slice(7, 10);

  const columnLayouts = [
    { id: 'left', data: leftColumn },
    { id: 'middle', data: middleColumn },
    { id: 'right', data: rightColumn },
  ];

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
          <div className="skills-grid-container">
            {columnLayouts.map((col) => (
              <div key={col.id} className="skills-vertical-track">
                {col.data.map((skill) => (
                  <div 
                    key={skill.name} 
                    className={`skill-block ${skill.colorShift ? 'shift-color' : ''}`}
                    title={skill.name}
                  >
                    <div className="block-content">
                      {skill.icon}
                      <span className="skill-name">{skill.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}