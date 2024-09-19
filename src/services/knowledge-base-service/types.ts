export interface KnowledgeBaseEntry {
  url: string;
  title: string;
  content: string;
  category: string;
}

export interface KnowledgeBaseServiceInterface {
  search(query: string): Promise<KnowledgeBaseEntry[]>;
  getRelevantKnowledge(query: string): Promise<string>;
}
