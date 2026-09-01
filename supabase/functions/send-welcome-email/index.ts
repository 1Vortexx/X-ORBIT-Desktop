import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL     = Deno.env.get('RESEND_FROM_EMAIL') ?? 'X-ORBIT <noreply@updates.xorbit.org>';
const APP_URL        = Deno.env.get('APP_URL') ?? 'https://xorbit.org';

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

    let body: { name?: string; email?: string; password?: string };
    try {
        body = await req.json();
    } catch {
        return new Response('Bad request', { status: 400, headers: corsHeaders });
    }

    const { name, email, password } = body;
    if (!email) {
        return new Response('Missing email', { status: 400, headers: corsHeaders });
    }

    const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d0d10;color:#ededf0;border-radius:10px;overflow:hidden">
            <div style="background:#141418;padding:24px 28px;border-bottom:3px solid #7c6af7">
                <span style="font-size:1.2rem;font-weight:900;letter-spacing:2px;color:#ededf0">X-<span style="color:#7c6af7">ORBIT</span></span>
            </div>
            <div style="padding:28px">
                <p style="margin:0 0 16px;font-size:1.1rem;font-weight:700;color:#ededf0">Welcome to X-ORBIT${name ? `, ${name}` : ''}!</p>
                <p style="margin:0 0 16px;color:#b2b2c4;font-size:0.9rem;line-height:1.6">Your account has been created. Here are your login details:</p>
                <div style="background:#1a1a1f;border-left:3px solid #7c6af7;padding:14px 18px;border-radius:4px;margin:12px 0;font-size:0.88rem;color:#b2b2c4;line-height:1.8">
                    <strong style="color:#ededf0">Email:</strong> ${email}<br>
                    <strong style="color:#ededf0">Password:</strong> ${password ?? '(as set by your admin)'}
                </div>
                <a href="${APP_URL}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#7c6af7;color:#fff;border-radius:6px;text-decoration:none;font-size:0.85rem;font-weight:700">Go to X-ORBIT</a>
            </div>
            <div style="padding:16px 28px;background:#141418;font-size:0.7rem;color:#70708a">
                You're receiving this because an account was created for you at xorbit.org.
            </div>
        </div>`;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: 'Welcome to X-ORBIT',
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
