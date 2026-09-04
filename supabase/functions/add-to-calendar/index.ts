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

    // Create calendar event
    // time이 비어있으면 09:00 기본값 사용 (슬롯 모델에서는 시간 미정)
    const eventTime = time || "09:00";
    const startDateTime = new Date(`${date}T${eventTime}:00`).toISOString();
    const endDateTime = new Date(
      new Date(`${date}T${eventTime}:00`).getTime() + 60 * 60 * 1000
    ).toISOString();

    const event = {
      summary: `${service || "예약"} - ${customer}`,
      description: `고객사: ${customer}\n서비스: ${service || "미정"}\n주소: ${address || "미정"}`,
      start: { dateTime: startDateTime, timeZone: "Asia/Seoul" },
      end: { dateTime: endDateTime, timeZone: "Asia/Seoul" },
      location: address || "",
    };

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
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
