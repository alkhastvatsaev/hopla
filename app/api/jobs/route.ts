import { NextResponse } from 'next/server';
import {
  getJobs,
  createJob,
  updateJob,
  getJob,
  getJobByPaymentIntent,
  claimJob,
} from '../../lib/firebaseService';
import { calculateCheckoutQuote, CHECKOUT_QUOTE_VERSION } from '../../lib/checkout';
import { verifyFirebaseRequest } from '../../lib/firebaseAuth';
import { getStripe } from '../../lib/stripe';

function sanitizeForFirestore(value: any): any {
  if (value === undefined) return undefined;
  if (typeof value === 'number' && Number.isNaN(value)) return null;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value
      .map(sanitizeForFirestore)
      .filter((v) => v !== undefined);
  }

  if (typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      const sv = sanitizeForFirestore(v);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }

  return value;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const job = await getJob(id);
      if (!job) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
      return NextResponse.json(job);
    }

    const user = await verifyFirebaseRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = sanitizeForFirestore(await request.json());

    if (!Array.isArray(body.items) || !body.location) {
      return NextResponse.json({ error: 'Données de mission manquantes' }, { status: 400 });
    }

    const quote = calculateCheckoutQuote({
      type: body.type,
      items: body.items,
      distanceKm: body.distanceKm,
      tip: body.tip,
    });

    let stripePaymentIntentId: string | undefined;
    if (body.paymentMethod === 'card') {
      if (typeof body.paymentIntentId !== 'string') {
        return NextResponse.json({ error: 'Paiement vérifiable requis' }, { status: 402 });
      }
      const existing = await getJobByPaymentIntent(body.paymentIntentId);
      if (existing) return NextResponse.json({ id: existing.id });

      const paymentIntent = await getStripe().paymentIntents.retrieve(body.paymentIntentId);
      if (
        paymentIntent.status !== 'succeeded' ||
        paymentIntent.currency !== 'eur' ||
        paymentIntent.amount !== quote.amountCents ||
        paymentIntent.metadata.quoteVersion !== CHECKOUT_QUOTE_VERSION
      ) {
        return NextResponse.json({ error: 'Paiement non vérifié' }, { status: 402 });
      }
      stripePaymentIntentId = paymentIntent.id;
    } else if (body.paymentMethod !== 'cash') {
      return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 });
    }

    const {
      paymentIntentId: _untrustedPaymentIntentId,
      isPaid: _untrustedPaidState,
      totalAmount: _untrustedTotal,
      ...job
    } = body;
    const newJob = await createJob({
      ...job,
      totalAmount: quote.amountCents / 100,
      isPaid: body.paymentMethod === 'card',
      ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
    });
    return NextResponse.json(newJob);
  } catch (error) {
    console.error("[API POST /jobs] Failed to create job");
    const message = error instanceof Error ? error.message : '';
    const isValidationError = /must|unsupported|outside|contain/i.test(message);
    return NextResponse.json(
      { error: isValidationError ? message : 'Impossible de créer la mission' },
      { status: isValidationError ? 400 : 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const body = sanitizeForFirestore(await request.json());
    const { id, status } = body;

    if (!id || typeof status !== 'string') {
      return NextResponse.json({ error: 'ID de mission manquant' }, { status: 400 });
    }

    const currentJob = await getJob(id) as any;
    if (!currentJob) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
    }

    const allowedTransitions: Record<string, string[]> = {
      open: ['taken'],
      taken: ['delivering', 'open'],
      delivering: ['completed', 'open'],
    };
    if (!allowedTransitions[currentJob.status]?.includes(status)) {
      return NextResponse.json({ error: 'Transition de statut invalide' }, { status: 409 });
    }

    if (status === 'taken' && currentJob.status === 'open') {
      await claimJob(id, {
        id: user.uid,
        name: typeof body.driverName === 'string' ? body.driverName.slice(0, 80) : 'Livreur',
        photoUrl: typeof body.driverPhotoUrl === 'string' ? body.driverPhotoUrl : null,
      });
      return NextResponse.json({ id, status });
    }

    if (currentJob.driverId !== user.uid) {
      return NextResponse.json({ error: 'Mission attribuée à un autre livreur' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'delivering') {
      const ticketPrice = Number(body.ticketPrice);
      if (!Number.isFinite(ticketPrice) || ticketPrice < 0 || ticketPrice > 10_000) {
        return NextResponse.json({ error: 'Montant du ticket invalide' }, { status: 400 });
      }
      updates.ticketPrice = ticketPrice;
      updates.totalToCollect = Number(body.totalToCollect);
    }
    if (status === 'completed') updates.isPaid = currentJob.paymentMethod === 'card';
    if (status === 'open') {
      updates.driverId = null;
      updates.driverName = null;
      updates.driverPhotoUrl = null;
    }

    await updateJob(id, updates);
    return NextResponse.json({ id, status });
  } catch (error) {
    if (error instanceof Error && error.message === 'JOB_ALREADY_CLAIMED') {
      return NextResponse.json({ error: 'Mission déjà acceptée' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Impossible de modifier la mission' }, { status: 500 });
  }
}

