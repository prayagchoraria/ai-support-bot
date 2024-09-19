import { TChatMessage } from "@/components/ai-chat/types";
import { logger } from "@/lib/logger";

export interface IEvaluationMetrics {
  responseTime: number;
  responseLength: number;
  relevanceScore: number;
}

export class EvaluationService {
  private static instance: EvaluationService;

  private constructor() {}

  public static getInstance(): EvaluationService {
    if (!EvaluationService.instance) {
      EvaluationService.instance = new EvaluationService();
    }
    return EvaluationService.instance;
  }

  public evaluateResponse(
    userMessage: Omit<TChatMessage, "id">,
    assistantMessage: Omit<TChatMessage, "id">,
    responseTime: number
  ): IEvaluationMetrics {
    try {
      const responseLength = assistantMessage.content.length;
      const relevanceScore = this.calculateRelevanceScore(
        userMessage.content,
        assistantMessage.content
      );

      return {
        responseTime,
        responseLength,
        relevanceScore,
      };
    } catch (error) {
      logger.error("Error in evaluateResponse:", error);
      return {
        responseTime,
        responseLength: 0,
        relevanceScore: 0,
      };
    }
  }

  private calculateRelevanceScore(
    userMessage: string,
    assistantMessage: string
  ): number {
    const userKeywords = this.extractKeywords(userMessage);
    const assistantKeywords = this.extractKeywords(assistantMessage);
    const commonKeywords = userKeywords.filter((keyword) =>
      assistantKeywords.includes(keyword)
    );
    return userKeywords.length > 0
      ? (commonKeywords.length / userKeywords.length) * 100
      : 0;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);
  }
}
