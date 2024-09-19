import { getFullKnowledgeBase } from "./../knowledge-base-service";
import { logger } from "@/lib/logger";

let globalKnowledgeBase: string | null = null;

export async function initializeServices() {
  logger.info("Initializing services...");
  try {
    globalKnowledgeBase = await getFullKnowledgeBase(
      process.env.KNOWLEDGE_BASE_PATH || ""
    );
    logger.info("Knowledge base loaded successfully");
  } catch (error) {
    logger.error("Failed to load knowledge base:", error);
    throw error;
  }
}

export function getGlobalKnowledgeBase(): string {
  if (!globalKnowledgeBase) {
    logger.error("Knowledge base not initialized");
    throw new Error("Knowledge base not initialized");
  }
  return globalKnowledgeBase;
}
