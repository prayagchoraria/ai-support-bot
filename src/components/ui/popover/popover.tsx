"use client";

import React, { useState, useRef } from "react";

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ trigger, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute z-10 w-64 p-2 bg-white rounded-lg shadow-xl bottom-full right-0 mb-1">
          {content}
        </div>
      )}
    </div>
  );
};
