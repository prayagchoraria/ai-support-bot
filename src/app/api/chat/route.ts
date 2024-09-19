import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai-service-singleton";
import { v4 as uuidv4 } from "uuid";
import { EvaluationService } from "@/services/evaluation-service";
import { logger } from "@/lib/logger";

const MAX_HISTORY_LENGTH = 10;
const conversationHistory = new Map<string, string[]>();

const rateLimits = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRateLimit = rateLimits.get(ip) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 1;
    userRateLimit.timestamp = now;
  } else {
    userRateLimit.count++;
  }

  rateLimits.set(ip, userRateLimit);
  return userRateLimit.count > MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  console.log("Received a POST request"); // Debug log
  try {
    const { prompt, context, sessionId } = await request.json();
    const ip = request.ip || "unknown";

    if (isRateLimited(ip)) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      logger.warn("Invalid or missing prompt received");
      return NextResponse.json(
        {
          error: "Invalid or missing prompt. Please provide a valid question.",
        },
        { status: 400 }
      );
    }

    let history = conversationHistory.get(sessionId) || [];

    if (history.length >= MAX_HISTORY_LENGTH * 2) {
      history = history.slice(-MAX_HISTORY_LENGTH * 2 + 2);
    }

    history.push(prompt);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!aiService) {
            throw new Error("AI service is not initialized");
          }

          let assistantResponse = "";
          const messageId = uuidv4();
          const startTime = Date.now();

          for await (const chunk of aiService.generateResponse(
            prompt,
            context || "",
            history
          )) {
            assistantResponse += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: chunk, id: messageId })}\n\n`
              )
            );
          }

          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const evaluationService = EvaluationService.getInstance();
          const metrics = evaluationService.evaluateResponse(
            { role: "user", content: prompt },
            { role: "assistant", content: assistantResponse },
            responseTime
          );

          history.push(assistantResponse);
          conversationHistory.set(sessionId, history);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ metrics, id: messageId })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          logger.error("Error generating response:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "An error occurred while processing your request." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("Unexpected error in POST /api/chat:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    conversationHistory.delete(sessionId);
    logger.info(`Conversation history cleared for session: ${sessionId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in DELETE /api/chat:", error);
    return NextResponse.json(
      { error: "An error occurred while clearing the conversation history." },
      { status: 500 }
    );
  }
}
