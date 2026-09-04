import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CrowdReport from '@/models/CrowdReport';
import { validateExternalApiKey } from '@/lib/external-api-auth';
import mongoose from 'mongoose';

export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['RECEIVED', 'UNDER_REVIEW', 'VALIDATED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    let report = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await CrowdReport.findByIdAndUpdate(id, { status }, { new: true });
    }

    if (!report) {
      report = await CrowdReport.findOneAndUpdate(
        { $or: [{ referenceId: id }, { localId: id }] },
        { status },
        { new: true }
      );
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
      message: `Report status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('[API /api/v1/external/reports/[id]/status PATCH]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update report status' },
      { status: 500 }
    );
  }
}
