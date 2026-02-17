import { NextResponse } from 'next/server';
import { getJobs, createJob, updateJob, getJob } from '../../lib/firebaseService';

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
    const body = await request.json();
    
    // Validation basique
    if (!body.items && !body.pickupLocation) {
      return NextResponse.json({ error: 'Données de mission manquantes' }, { status: 400 });
    }

    const newJob = await createJob(body);
    return NextResponse.json(newJob);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
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

    await updateJob(id, { status, ...updates });
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

