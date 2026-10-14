"use client";

import { useEffect, useState, type ElementType } from "react";

interface TextTypeProps {
  text: string[];
  as?: ElementType;
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  initialDelay?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
}

export default function TextType({
  text,
  as: Component = "span",
  className = "",
  typingSpeed = 70,
  deletingSpeed = 35,
  pauseDuration = 1800,
  initialDelay = 400,
  loop = true,
  showCursor = true,
  cursorCharacter = "|",
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!text.length) return;

    const currentText = text[textIndex % text.length];
    let delay = typingSpeed;
    let nextDeleting = isDeleting;

    if (!isDeleting && displayedText === currentText) {
      if (!loop && textIndex === text.length - 1) return;

      delay = pauseDuration;
      nextDeleting = true;
    } else if (isDeleting && displayedText === "") {
      delay = 250;
      nextDeleting = false;
    } else if (isDeleting) {
      delay = deletingSpeed;
    } else if (displayedText === "" && textIndex === 0) {
      delay = initialDelay;
    }

    const timeout = window.setTimeout(() => {
      if (!isDeleting && displayedText === currentText) {
        setIsDeleting(true);
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        setTextIndex((prev) =>
          prev === text.length - 1 ? (loop ? 0 : prev) : prev + 1,
        );
      } else if (isDeleting) {
        setDisplayedText((prev) => prev.slice(0, -1));
      } else {
        setDisplayedText(currentText.slice(0, displayedText.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    displayedText,
    textIndex,
    isDeleting,
    text,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    initialDelay,
    loop,
  ]);

  return (
    <Component
      className={`inline-block whitespace-nowrap ${className}`}
      aria-label={text.join(", ")}
    >
      <span aria-hidden="true">{displayedText}</span>
      {showCursor && (
        <span aria-hidden="true" className="ml-1 inline-block animate-pulse">
          {cursorCharacter}
        </span>
      )}
    </Component>
  );
}
