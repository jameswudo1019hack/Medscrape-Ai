import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()

  try {
    const response = await fetch("http://localhost:8000/api/search/agent-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Backend error" }))
      return Response.json(
        { error: error.detail || "Deep research failed" },
        { status: response.status }
      )
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch {
    return Response.json(
      { error: "Cannot reach backend. Make sure the FastAPI server is running on port 8000." },
      { status: 503 }
    )
  }
}
