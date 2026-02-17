import { NextResponse } from 'next/server';
import { getJobs, createJob, updateJob, getJob } from '../../lib/firebaseService';

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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

    await updateJob(id, { status, ...updates });
    return NextResponse.json({ id, status, ...updates });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
     // CAUTION: This deletes ALL open jobs or ALL jobs. 
     // For safety, let's only delete 'open' jobs in a loop for now or implement a clean function.
     // Assuming we want a hard reset for dev:
     const jobs = await getJobs();
     for (const job of jobs) {
       await updateJob(job.id, { status: 'cancelled' }); // Soft delete or reuse updateJob
     }
     return NextResponse.json({ success: true, count: jobs.length });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
