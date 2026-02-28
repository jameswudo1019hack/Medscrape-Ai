import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.json()

  try {
    const response = await fetch("http://localhost:8000/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: response.status }
      )
    }

    const pdfBuffer = await response.arrayBuffer()
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=synapse-report.pdf",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Cannot reach backend." },
      { status: 503 }
    )
  }
}
