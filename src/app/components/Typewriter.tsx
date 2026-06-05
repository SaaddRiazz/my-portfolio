"use client";

import { useState, useEffect } from 'react';

interface TypewriterProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
  startDelay?: number; // Added to wait out layout entrances
}

export default function Typewriter({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenWords = 1500,
  startDelay = 1300, // Syncs with the subtitle's animation time
}: TypewriterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState(words[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prefix, setPrefix] = useState('a');
  const [isReadyToType, setIsReadyToType] = useState(false);

  // Initial gate delay to let elements arrive in layout coordinates
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsReadyToType(true);
    }, startDelay);
    return () => clearTimeout(startTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!isReadyToType) return; // Freeze text iteration until layout slides in

    let timer: NodeJS.Timeout;
    const fullWord = words[currentWordIndex];

    if (fullWord) {
      const firstLetter = fullWord.trim().charAt(0).toLowerCase();
      const properPrefix = ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
      setPrefix(properPrefix);
    }

    if (!isDeleting) {
      if (currentText !== fullWord) {
        timer = setTimeout(() => {
          setCurrentText(fullWord.substring(0, currentText.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => setIsDeleting(true), delayBetweenWords);
      }
    } else {
      if (currentText !== '') {
        timer = setTimeout(() => {
          setCurrentText(fullWord.substring(0, currentText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords, isReadyToType]);

  return (
    <span className="typewriter-sentence">
      I&apos;m {prefix} {currentText}
      <span className="insert-cursor">&nbsp;</span>

      <style>{`
        .typewriter-sentence {
          white-space: pre-wrap;
        }
        /* ===== Premium Block Style Typing Cursor ===== */
        .insert-cursor {
          display: inline-block;
          width: 3px;                  /* Thinned down slightly for a sharper look */
          height: 1.35rem;             /* Locked to text scale proportions */
          background-color: #ffffff;   /* Pure white ensures perfect contrast on teal */
          margin-left: 6px;
          vertical-align: middle;
          animation: blink 0.9s infinite steps(2, start);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.4); /* Subtle glow effect */
        }

        /* Classic snappy hard-blink animation */
        @keyframes blink {
          to {
            visibility: hidden;
          }
        }
      `}</style>
    </span>
  );
}