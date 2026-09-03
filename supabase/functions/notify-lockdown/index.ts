import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let body: { email?: string; username?: string; timestamp?: string; user_agent?: string };
    try {
        body = await req.json();
    } catch {
        return new Response('Bad request', { status: 400, headers: corsHeaders });
    }

    const { email, username, timestamp, user_agent } = body;

    const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d10;color:#ededf0;border-radius:10px;overflow:hidden">
            <div style="background:#141418;padding:24px 28px;border-bottom:3px solid #f87171">
                <span style="font-size:1.2rem;font-weight:900;letter-spacing:2px;color:#ededf0">X-<span style="color:#f87171">ORBIT</span></span>
            </div>
            <div style="padding:28px">
                <p style="margin:0 0 16px;font-size:1.1rem;font-weight:700;color:#f87171">LOCKDOWN TRIGGERED</p>
                <p style="margin:0 0 16px;color:#b2b2c4;font-size:0.9rem;line-height:1.6">A system powerwash was executed via the dev console. X-ORBIT is now in lockdown mode.</p>
                <div style="background:#1a1a1f;border-left:3px solid #f87171;padding:14px 18px;border-radius:4px;margin:12px 0;font-size:0.88rem;color:#b2b2c4;line-height:1.8">
                    <strong style="color:#ededf0">User:</strong> ${username || 'Unknown'}<br>
                    <strong style="color:#ededf0">Email:</strong> ${email || 'Unknown'}<br>
                    <strong style="color:#ededf0">Time:</strong> ${timestamp || 'Unknown'}<br>
                    <strong style="color:#ededf0">User Agent:</strong> ${user_agent || 'Unknown'}
                </div>
            </div>
            <div style="padding:16px 28px;background:#141418;font-size:0.7rem;color:#70708a">
                This is an automated alert from X-ORBIT's dev console. The lockdown can only be reversed by clearing the browser's localStorage.
            </div>
        </div>`;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'X-ORBIT Alerts <noreply@updates.xorbit.org>',
            to: ['breakdancingduck12@gmail.com'],
            subject: `LOCKDOWN: X-ORBIT powerwash triggered by ${username || email || 'Unknown'}`,
            html,
        }),
    });

    const resBody = await res.json();

    if (!res.ok) {
        return new Response(JSON.stringify({ error: resBody }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ sent: true, id: resBody.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
});
