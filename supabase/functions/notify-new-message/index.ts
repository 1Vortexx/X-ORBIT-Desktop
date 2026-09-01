import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL       = Deno.env.get('RESEND_FROM_EMAIL') ?? 'X-ORBIT <noreply@updates.xorbit.org>';
const APP_URL          = Deno.env.get('APP_URL') ?? 'https://xorbit.org/jittery.html';

serve(async (req) => {
    // Supabase database webhooks send a POST with the record payload
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    let body: { record?: Record<string, unknown> };
    try {
        body = await req.json();
    } catch {
        return new Response('Bad request', { status: 400 });
    }

    const msg = body.record;
    if (!msg) return new Response('No record', { status: 400 });

    const { conversation_id, sender_email, sender_name, message } = msg as {
        conversation_id: string;
        sender_email: string;
        sender_name: string;
        message: string;
    };

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Look up the conversation to find the recipient
    const { data: conv, error: convErr } = await sb
        .from('dm_conversations')
        .select('participant_1_email, participant_2_email, is_group, group_name, participants')
        .eq('id', conversation_id)
        .single();

    if (convErr || !conv) return new Response('Conv not found', { status: 404 });

    // Build list of recipient emails (everyone except the sender)
    let recipients: string[] = [];
    if (conv.is_group) {
        recipients = (conv.participants as string[]).filter((e: string) => e !== sender_email);
    } else {
        const other = conv.participant_1_email === sender_email
            ? conv.participant_2_email
            : conv.participant_1_email;
        recipients = [other];
    }

    if (recipients.length === 0) return new Response('No recipients', { status: 200 });

    // Send one email per recipient via Resend
    const preview = (message ?? '').substring(0, 200);
    const subject = conv.is_group
        ? `${sender_name || sender_email} sent a message in ${conv.group_name || 'a group'}`
        : `New message from ${sender_name || sender_email}`;

    const results = await Promise.all(recipients.map(async (to) => {
        const html = `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d10;color:#ededf0;border-radius:10px;overflow:hidden">
                <div style="background:#141418;padding:24px 28px;border-bottom:3px solid #7c6af7">
                    <span style="font-size:1.2rem;font-weight:900;letter-spacing:2px;color:#ededf0">X-<span style="color:#7c6af7">ORBIT</span></span>
                </div>
                <div style="padding:28px">
                    <p style="margin:0 0 12px;color:#b2b2c4;font-size:0.85rem">You have a new message</p>
                    <p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:#ededf0">${sender_name || sender_email}</p>
                    <div style="background:#1a1a1f;border-left:3px solid #7c6af7;padding:12px 16px;border-radius:4px;margin:12px 0;font-size:0.9rem;color:#b2b2c4">${preview}</div>
                    <a href="${APP_URL}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#7c6af7;color:#fff;border-radius:6px;text-decoration:none;font-size:0.85rem;font-weight:700">Open Messages</a>
                </div>
                <div style="padding:16px 28px;background:#141418;font-size:0.7rem;color:#70708a">
                    You're receiving this because you have an X-ORBIT account at xorbit.org. Log in to manage notification preferences.
                </div>
            </div>`;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
        });
        return { to, status: res.status };
    }));

    return new Response(JSON.stringify({ sent: results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
});
