import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()

  try {
    const response = await fetch("http://localhost:8000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Backend error" }))
      return NextResponse.json(
        { error: error.detail || "Search failed" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Cannot reach backend. In a second terminal run: npm run dev:backend (see README if you haven’t set up the Python venv)." },
      { status: 503 }
    )
  }
}
