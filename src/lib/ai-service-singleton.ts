import {
  createAIService,
  IAIModelConfig,
  IAIService,
} from "@/services/ai-service";
import { logger } from "@/lib/logger";

logger.info("Initializing AI service singleton...");

const aiModelConfig: IAIModelConfig = {
  type: (process.env.AI_MODEL_TYPE as "openai" | "other_model") || "openai",
  apiKey: process.env.AI_MODEL_API_KEY || "",
  model: process.env.AI_MODEL_NAME,
  knowledgeBasePath: process.env.KNOWLEDGE_BASE_PATH || "",
};

let aiService: IAIService;

try {
  aiService = createAIService(aiModelConfig);
  logger.info("AI service singleton initialized successfully");
} catch (error) {
  logger.error("Failed to initialize AI service singleton:", error);
  throw error;
}

export { aiService };
