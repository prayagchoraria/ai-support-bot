import OpenAI from "openai";
import {
  KnowledgeBaseServiceInterface,
  createKnowledgeBaseService,
} from "../knowledge-base-service";
import { appConfig } from "@/config/app-config";
import { logger } from "@/lib/logger";

const openai = new OpenAI({
  apiKey: process.env.AI_MODEL_API_KEY,
});

export interface IAIService {
  generateResponse(
    prompt: string,
    context: string,
    history: string[]
  ): AsyncGenerator<string, void, unknown>;
}

export interface IAIModelConfig {
  type: "openai" | "other_model";
  apiKey: string;
  model?: string;
  knowledgeBasePath: string;
}

class OpenAIService implements IAIService {
  private model: string;
  private maxHistoryLength: number;
  private knowledgeBaseService: KnowledgeBaseServiceInterface;

  constructor(config: IAIModelConfig) {
    logger.info("Initializing OpenAIService...");
    this.model = config.model || process.env.AI_MODEL_NAME || "gpt-3.5-turbo";
    this.maxHistoryLength = 5;
    this.knowledgeBaseService = createKnowledgeBaseService(
      config.knowledgeBasePath
    );
    logger.info(`OpenAIService initialized with model: ${this.model}`);
  }

  async *generateResponse(
    prompt: string,
    context: string,
    history: string[]
  ): AsyncGenerator<string, void, unknown> {
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      logger.warn("Invalid or empty prompt provided");
      yield "I'm sorry, but I didn't receive a valid question. Could you please ask something?";
      return;
    }

    try {
      const relevantKnowledge =
        await this.knowledgeBaseService.getRelevantKnowledge(prompt);

      const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [
        {
          role: "system",
          content: `${appConfig.systemPrompt}\n\nRelevant knowledge:\n${relevantKnowledge}\n\nFormat your response with proper paragraphs, line breaks, and lists where appropriate. End your response with a new paragraph encouraging further questions.`,
        },
        ...history.slice(-this.maxHistoryLength * 2).map((message, index) => ({
          role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
          content: message,
        })),
        {
          role: "user" as const,
          content: appConfig.userPromptTemplate
            .replace("{context}", context)
            .replace("{prompt}", prompt),
        },
      ];

      const stream = await openai.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        yield content;
      }
    } catch (error) {
      logger.error("Error generating response:", error);
      yield "I apologize, but I encountered an error while processing your request. Please try again later.";
    }
  }
}

export function createAIService(config: IAIModelConfig): IAIService {
  logger.info("Creating AI service...");
  switch (config.type) {
    case "openai":
      const service = new OpenAIService(config);
      logger.info("OpenAI service created successfully");
      return service;
    default:
      logger.error(`Unsupported AI model type: ${config.type}`);
      throw new Error(`Unsupported AI model type: ${config.type}`);
  }
}

export { OpenAIService };
