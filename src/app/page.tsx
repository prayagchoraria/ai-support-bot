"use client";

import AIChat from "@/components/ai-chat";
import { TChatMessage } from "@/components/ai-chat/types";
import { appConfig } from "@/config/app-config";
import { useEffect, useState } from "react";

const initialMessages: TChatMessage[] = [
  { role: "assistant", content: appConfig.initialMessage, id: "intro-message" },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <h1 className="text-2xl font-bold mb-4">{appConfig.appTitle}</h1>
      </div>
      <div className="w-full max-w-2xl h-[600px] bg-white shadow-xl rounded-lg overflow-hidden">
        <AIChat initialMessages={initialMessages} />
      </div>
    </main>
  );
}
