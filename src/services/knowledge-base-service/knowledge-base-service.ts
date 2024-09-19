import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

export interface KnowledgeBaseEntry {
  url: string;
  title: string;
  content: string;
  category: string;
}

export interface KnowledgeBaseServiceInterface {
  search(query: string): Promise<KnowledgeBaseEntry[]>;
  getRelevantKnowledge(query: string): Promise<string>; // Changed to Promise<string>
}

interface CSVRecord {
  url: string;
  "metadata/title": string;
  text: string;
  "crawl/depth": string;
  [key: string]: string;
}

class CSVKnowledgeBaseService implements KnowledgeBaseServiceInterface {
  private entries: KnowledgeBaseEntry[] = [];

  constructor(filePath: string) {
    try {
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), filePath),
        "utf-8"
      );

      console.log("First 100 characters of file:", fileContent.slice(0, 100));

      const cleanedContent = fileContent.replace(/^\uFEFF/, "");

      const records = parse(cleanedContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as CSVRecord[];

      console.log("First record:", JSON.stringify(records[0], null, 2));

      this.entries = records.map((record) => ({
        url: record.url || "",
        title: record["metadata/title"] || "",
        content: record.text || "",
        category: record["crawl/depth"] || "",
      }));

      console.log("First entry:", JSON.stringify(this.entries[0], null, 2));
      console.log(
        `Loaded ${this.entries.length} entries from the knowledge base`
      );
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      throw new Error("Failed to load knowledge base");
    }
  }

  async search(query: string): Promise<KnowledgeBaseEntry[]> {
    console.log("Searching for query:", query);
    console.log("Number of entries:", this.entries.length);

    if (!query || typeof query !== "string" || query.trim() === "") {
      console.warn("Invalid or empty query provided");
      return [];
    }

    if (this.entries.length === 0) {
      console.warn("No entries in the knowledge base");
      return [];
    }

    const lowercaseQuery = query.toLowerCase();
    const queryWords = lowercaseQuery.split(/\s+/);

    const results = this.entries
      .map((entry) => {
        const titleScore = this.calculateRelevanceScore(
          entry.title,
          queryWords
        );
        const contentScore = this.calculateRelevanceScore(
          entry.content,
          queryWords
        );
        return { entry, score: titleScore * 2 + contentScore };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((result) => result.entry);

    return results;
  }

  private calculateRelevanceScore(text: string, queryWords: string[]): number {
    const lowercaseText = text.toLowerCase();
    return queryWords.reduce((score, word) => {
      return score + (lowercaseText.includes(word) ? 1 : 0);
    }, 0);
  }

  getFullKnowledgeBase(): string {
    return this.entries
      .map(
        (entry) =>
          `Title: ${entry.title}\nContent: ${entry.content}\nCategory: ${entry.category}\nURL: ${entry.url}\n\n`
      )
      .join("");
  }

  async getRelevantKnowledge(query: string): Promise<string> {
    const results = await this.search(query);
    return results
      .map(
        (entry) =>
          `Title: ${entry.title}\nContent: ${entry.content}\nCategory: ${entry.category}\nURL: ${entry.url}\n\n`
      )
      .join("");
  }
}

export function createKnowledgeBaseService(
  filePath: string
): KnowledgeBaseServiceInterface {
  return new CSVKnowledgeBaseService(filePath);
}

// Update this function to be async
export async function getFullKnowledgeBase(filePath: string): Promise<string> {
  const service = createKnowledgeBaseService(filePath);
  return await (service as CSVKnowledgeBaseService).getFullKnowledgeBase();
}
