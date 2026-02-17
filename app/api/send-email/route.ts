
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, trackingId, deliveryFee, total, items } = await request.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Hopla <onboarding@resend.dev>', // Default testing domain
        to: [email],
        subject: 'Votre commande Hopla est confirmée ! 🚀',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007AFF;">Merci pour votre commande !</h1>
            <p>Votre demande a bien été reçue et un livreur va la prendre en charge sous peu.</p>
            
            <div style="background: #f5f5f7; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3>Récapitulatif</h3>
              <p><strong>Total estimé :</strong> ${(parseFloat(total) + deliveryFee).toFixed(2)}€</p>
              <p><strong>Articles :</strong> ${items.length}</p>
            </div>
 
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/tracking/${trackingId}" style="background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Suivre ma commande
            </a>
            
            <p style="margin-top: 20px; color: #86868b; font-size: 12px;">
              L'équipe Hopla
            </p>
          </div>
        `
      })
    });


    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Email sending failed');
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
