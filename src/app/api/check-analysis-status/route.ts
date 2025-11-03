import { createClient, getServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get jobId from query parameters
    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    // Use service role to query job
    const serviceSupabase = getServiceClient();

    const { data: job, error: queryError } = await serviceSupabase
      .from('weapon_analysis_jobs')
      .select('id, user_id, status, result, error_message, created_at, updated_at')
      .eq('id', jobId)
      .single();

    if (queryError) {
      console.error('[check-analysis-status] Query error:', queryError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify that the job belongs to the current user
    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Return job status
    return NextResponse.json(
      {
        status: job.status,
        result: job.result,
        error: job.error_message,
        error_message: job.error_message,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[check-analysis-status] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
