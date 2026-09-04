import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CrowdReport from '@/models/CrowdReport';
import { validateExternalApiKey } from '@/lib/external-api-auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateExternalApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid x-api-key header' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const { id } = params;

    let report = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await CrowdReport.findById(id);
    }

    if (!report) {
      report = await CrowdReport.findOne({
        $or: [{ referenceId: id }, { localId: id }],
      });
    }

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[API /api/v1/external/reports/[id] GET]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch report detail' },
      { status: 500 }
    );
  }
}
