import { NextRequest, NextResponse } from "next/server";

interface CareerPathRequest {
  fullName: string | null;
  targetCareer: string | null;
  previousEducation: string | null;
  city: string | null;
  enrolledPrograms: string;
  earnedCredentials: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CareerPathRequest;
    const { fullName, targetCareer, previousEducation, city, enrolledPrograms, earnedCredentials } = body;

    const prompt = `You are a career advisor for Sri Lankan students. Based on this student's profile, suggest realistic career paths.

Student Profile:
- Name: ${fullName ?? "Student"}
- Education Level: ${previousEducation ?? "Not specified"}
- Target Career: ${targetCareer ?? "Not specified"}
- City: ${city ?? "Sri Lanka"}
- Enrolled Programs: ${enrolledPrograms || "None yet"}
- Credentials Earned: ${earnedCredentials || "None yet"}

Return ONLY a JSON object with this exact structure, no other text, no markdown:
{
  "clusters": [
    {
      "name": "Cluster Name",
      "roles": [
        { "title": "Job Title", "skill": "Key skill to learn" }
      ]
    }
  ]
}

Rules:
- Return 2-3 clusters relevant to their background
- Each cluster should have 2-3 roles
- Skills should be specific and actionable
- Consider the Sri Lankan job market
- If target career is set, align clusters toward it`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Groq API error: ${error}` }, { status: response.status });
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as { clusters: unknown[] };

    if (!parsed.clusters || !Array.isArray(parsed.clusters)) {
      return NextResponse.json({ error: "Invalid response structure from AI" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Career path API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}