import { NextResponse } from 'next/server';
import { getJobs, createJob, updateJob, getJob } from '../../lib/firebaseService';

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

    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = sanitizeForFirestore(await request.json());
    
    // Validation basique
    if (!body.items && !body.pickupLocation) {
      return NextResponse.json({ error: 'Données de mission manquantes' }, { status: 400 });
    }

    console.log("[API POST /jobs] Checking environment variables...");
    const hasFirebaseEnv = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!hasFirebaseEnv) {
      console.warn("[API POST /jobs] WARNING: NEXT_PUBLIC_FIREBASE_PROJECT_ID is undefined on the server!");
    }

    console.log("[API POST /jobs] Creating job...");
    
    // Add a 10-second timeout so the Vercel function doesn't hang forever
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Firebase createJob command timed out after 8 seconds. This means Vercel cannot connect to Firebase (probably missing or incorrect ENV keys).")), 8000)
    );

    const newJob = await Promise.race([
      createJob(body),
      timeoutPromise
    ]) as { id: string };

    console.log("[API POST /jobs] Job created successfully:", newJob.id);
    return NextResponse.json(newJob);
  } catch (e: any) {
    console.error("[API POST /jobs] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = sanitizeForFirestore(await request.json());
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de mission manquant' }, { status: 400 });
    }
    
    const currentJob = await getJob(id) as any;
    if (!currentJob) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
    }

    // LOGIQUE ANTI-COLLISION / RACE CONDITION
    if (status === 'taken' && currentJob.status !== 'open') {
      return NextResponse.json({ 
        error: 'Désolé, cette mission a déjà été acceptée par un autre livreur.',
        status: currentJob.status 
      }, { status: 409 });
    }

    // Empêcher le changement d'adresse si un livreur est déjà en route
    if ((updates.location || updates.locationCoords) && currentJob.status !== 'open') {
      return NextResponse.json({ error: 'Modification d\'adresse invisible une fois le livreur en route.' }, { status: 403 });
    }

    await updateJob(id, sanitizeForFirestore({ status, ...updates }));
    return NextResponse.json({ id, status, ...updates });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
     // Suppression/Annulation de toutes les missions en parallèle pour plus de performance
     const jobs = await getJobs();
     if (jobs.length === 0) {
       return NextResponse.json({ success: true, count: 0 });
     }

     await Promise.all(jobs.map(job => updateJob(job.id, { status: 'cancelled' })));

     return NextResponse.json({ success: true, count: jobs.length });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

