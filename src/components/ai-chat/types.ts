export interface IAIChatProps {
  initialMessages?: TChatMessage[];
}

export interface TChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  feedback?: "up" | "down";
  metrics?: {
    responseTime: number;
    responseLength: number;
    relevanceScore: number;
  };
}

export interface IChatError {
  message: string;
}
