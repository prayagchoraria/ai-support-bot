"use client";

import React, { useState, useRef, useEffect } from "react";
import { TChatMessage } from "./types";
import { appConfig } from "@/config/app-config";
import ReactMarkdown from "react-markdown";
import { ThumbsUp, ThumbsDown, Info, Clock } from "react-feather";
import { Popover } from "@/components/ui/popover";

interface AIChartProps {
  initialMessages: TChatMessage[];
}

const AIChat: React.FC<AIChartProps> = ({ initialMessages }) => {
  const [messages, setMessages] = useState<TChatMessage[]>(() =>
    initialMessages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp || new Date(),
      id: msg.id || Date.now().toString(),
    }))
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError(null);

    const userMessage: TChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          context: "",
          sessionId: "unique-session-id",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      const assistantMessage: TChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage.content += parsed.content;
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { ...assistantMessage },
                ]);
              } else if (parsed.metrics) {
                assistantMessage.metrics = parsed.metrics;
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { ...assistantMessage },
                ]);
              }
            } catch (error) {
              console.error("Error parsing SSE data:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: appConfig.fallbackResponse,
          timestamp: new Date(),
        },
      ]);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch("/api/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "unique-session-id" }),
      });
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content: appConfig.initialMessage,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleFeedback = async (messageId: string, feedback: "up" | "down") => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, feedback }),
      });
      if (!response.ok) throw new Error("Failed to submit feedback");
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, feedback } : msg
        )
      );
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toISOString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 mb-4">
        {error && <div className="text-red-500 mb-2">{error}</div>}{" "}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-800 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <ReactMarkdown className="flex flex-col gap-4 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6">
                {message.content}
              </ReactMarkdown>
              <div
                className={`mt-2 flex items-center justify-between text-xs ${message.role === "user" ? "text-blue-200" : "text-gray-500"}`}
              >
                <span className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  {message.timestamp && (
                    <time dateTime={formatDateTime(message.timestamp)}>
                      {new Date(message.timestamp).toLocaleString()}
                    </time>
                  )}
                </span>
                {message.role === "assistant" &&
                  message.id !== messages[0].id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFeedback(message.id, "up")}
                        className={`text-gray-500 hover:text-green-500 ${
                          message.feedback === "up" ? "text-green-500" : ""
                        }`}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, "down")}
                        className={`text-gray-500 hover:text-red-500 ${
                          message.feedback === "down" ? "text-red-500" : ""
                        }`}
                      >
                        <ThumbsDown size={12} />
                      </button>
                      {message.metrics && (
                        <Popover
                          trigger={
                            <button className="text-gray-500 hover:text-blue-800">
                              <Info size={12} />
                            </button>
                          }
                          content={
                            <div className="p-2 text-xs">
                              <p>
                                Response Time: {message.metrics.responseTime}ms
                              </p>
                              <p>
                                Response Length:{" "}
                                {message.metrics.responseLength} characters
                              </p>
                              <p>
                                Relevance Score:{" "}
                                {message.metrics.relevanceScore.toFixed(2)}%
                              </p>
                            </div>
                          }
                        />
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-l-lg text-gray-700"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-800 text-white p-2 rounded-r-lg"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
        <button
          onClick={handleClearChat}
          className="w-full bg-gray-200 text-gray-700 p-2 rounded-lg"
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
};

export default AIChat;
