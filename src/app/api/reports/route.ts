import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSingleUserId } from '@/lib/single-user';

export async function GET(request: NextRequest) {
  try {
    const userId = getSingleUserId();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const repositoryId = searchParams.get('repositoryId');
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('repository_reports')
      .select(`
        *,
        repositories!inner (
          id,
          name,
          full_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by repository if specified
    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('repository_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      data: reports || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('Failed to get reports:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getSingleUserId();
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('repository_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
