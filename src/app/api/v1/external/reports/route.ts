import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CrowdReport from '@/models/CrowdReport';
import { validateExternalApiKey } from '@/lib/external-api-auth';

export async function GET(request: NextRequest) {
  if (!validateExternalApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid x-api-key header' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const reports = await CrowdReport.find(query).sort({ createdAt: -1 }).limit(limit);

    return NextResponse.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error: any) {
    console.error('[API /api/v1/external/reports GET]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch external reports' },
      { status: 500 }
    );
  }
}
