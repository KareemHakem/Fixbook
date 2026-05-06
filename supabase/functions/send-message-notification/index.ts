import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { record } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get the chat to find who the recipient is
    const { data: chat } = await supabase
      .from("chats")
      .select("normal_user_id, skilled_user_id")
      .eq("id", record.chat_id)
      .single();

    if (!chat) return new Response("chat not found", { status: 200 });

    // The recipient is the other person in the chat
    const recipientId =
      chat.normal_user_id === record.sender_id
        ? chat.skilled_user_id
        : chat.normal_user_id;

    // Get recipient push token
    const { data: recipient } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", recipientId)
      .single();

    // If no token, nothing to do
    if (!recipient?.expo_push_token) {
      return new Response("no token", { status: 200 });
    }

    // Get sender name
    const { data: sender } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", record.sender_id)
      .single();

    // Send the push notification via Expo
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient.expo_push_token,
        title: sender?.full_name ?? "New message",
        body: record.content,
        data: {
          chatId: record.chat_id,
          otherName: sender?.full_name,
        },
        sound: "default",
      }),
    });

    return new Response("ok", { status: 200 });

  } catch (error) {
    console.error("Error:", error);
    return new Response("error", { status: 500 });
  }
});