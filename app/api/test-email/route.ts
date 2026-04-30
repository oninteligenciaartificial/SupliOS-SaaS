import { NextResponse } from "next/server";

// TEMPORAL — delete after testing
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) return NextResponse.json({ error: "Falta ?to=email" }, { status: 400 });

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS ?? "noreply@gestios.app";

  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY no configurada" }, { status: 500 });

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "GestiOS Test", email: fromEmail },
      to: [{ email: to }],
      subject: "Test email GestiOS",
      htmlContent: "<p>Si ves esto, Brevo funciona correctamente.</p>",
    }),
  });

  const body = await res.json();
  return NextResponse.json({ status: res.status, brevo_response: body, from: fromEmail });
}
