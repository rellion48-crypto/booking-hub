import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const {
      refreshToken,
      customer,
      service,
      date,
      time,
      address,
    } = await req.json();

    console.log("📥 수신 데이터:", JSON.stringify({ refreshToken: refreshToken?.substring(0, 20), customer, service, date, time, address }));

    // Validate required fields
    if (!refreshToken || !customer || !date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: refreshToken, customer, date" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get new access token using refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return new Response(
        JSON.stringify({ error: "Failed to refresh token", details: error }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;


    // ISO 8601 형식 검증
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ISO 8601 형식으로 직접 생성 (09:00 기본값)
    const startDateTime = `${date}T09:00:00+09:00`;
    const endDateTime = `${date}T10:00:00+09:00`;
    console.log("📅 DateTime strings:", { startDateTime, endDateTime });

    const event = {
      summary: `${service || "예약"} - ${customer}`,
      description: `고객사: ${customer}\n서비스: ${service || "미정"}\n주소: ${address || "미정"}`,
      start: { dateTime: startDateTime, timeZone: "Asia/Seoul" },
      end: { dateTime: endDateTime, timeZone: "Asia/Seoul" },
      location: address || "",
    };

    console.log("📅 Google Calendar event:", JSON.stringify(event, null, 2));

    const calendarResponse = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.json();
      return new Response(
        JSON.stringify({ error: "Failed to create calendar event", details: error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const calendarEvent = await calendarResponse.json();
    return new Response(JSON.stringify({ success: true, eventId: calendarEvent.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error:", errorMessage, errorStack);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        stack: errorStack,
        type: error instanceof Error ? error.constructor.name : typeof error,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
