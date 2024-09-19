import { NextResponse } from "next/server";

// This would be replaced with a real database in a production environment
const feedbackStore = new Map<
  string,
  { thumbsUp: number; thumbsDown: number }
>();

export async function POST(request: Request) {
  try {
    const { messageId, feedback } = await request.json();

    if (!messageId || !feedback) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const messageFeedback = feedbackStore.get(messageId) || {
      thumbsUp: 0,
      thumbsDown: 0,
    };

    if (feedback === "up") {
      messageFeedback.thumbsUp++;
    } else if (feedback === "down") {
      messageFeedback.thumbsDown++;
    } else {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    feedbackStore.set(messageId, messageFeedback);

    return NextResponse.json({ success: true, feedback: messageFeedback });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");

  if (!messageId) {
    return NextResponse.json(
      { error: "Message ID is required" },
      { status: 400 }
    );
  }

  const feedback = feedbackStore.get(messageId) || {
    thumbsUp: 0,
    thumbsDown: 0,
  };

  return NextResponse.json(feedback);
}
