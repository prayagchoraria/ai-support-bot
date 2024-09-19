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
