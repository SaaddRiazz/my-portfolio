"use client";

import { useState, useEffect } from 'react';

interface TypewriterProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
}

export default function Typewriter({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenWords = 1500,
}: TypewriterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [prefix, setPrefix] = useState('a');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fullWord = words[currentWordIndex];

    // Check if the current word starts with a vowel to toggle "a" or "an"
    if (fullWord) {
      const firstLetter = fullWord.trim().charAt(0).toLowerCase();
      const properPrefix = ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
      setPrefix(properPrefix);
    }

    if (!isDeleting) {
      // Typing effect
      if (currentText !== fullWord) {
        timer = setTimeout(() => {
          setCurrentText(fullWord.substring(0, currentText.length + 1));
        }, typingSpeed);
      } else {
        // Pause before deleting
        timer = setTimeout(() => setIsDeleting(true), delayBetweenWords);
      }
    } else {
      // Deleting effect
      if (currentText !== '') {
        timer = setTimeout(() => {
          setCurrentText(fullWord.substring(0, currentText.length - 1));
        }, deletingSpeed);
      } else {
        // Move to the next word
        setIsDeleting(false);
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    // Standardized spacing using standard text flow
    <span className="typewriter-sentence">
      I&apos;m {prefix} {currentText}
      <span className="insert-cursor">&nbsp;</span>

      {/* Styled thick insert-mode cursor */}
      <style>{`
        .typewriter-sentence {
          white-space: pre-wrap; /* Guarantees standard space character widths */
        }
        .insert-cursor {
          display: inline-block;
          width: 8px; 
          height: 1.1em;
          background-color: #e84057; 
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 0.8s infinite steps(2, start);
        }
        @keyframes blink {
          to { visibility: hidden; }
        }
      `}</style>
    </span>
  );
}