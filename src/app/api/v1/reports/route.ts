import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CrowdReport, { generateReferenceId } from '@/models/CrowdReport';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      localId,
      reporterPhone,
      incidentType,
      description,
      userSeverity,
      roadBlocked,
      peopleNearby,
      buildingsNearby,
      location,
      images,
    } = body;

    if (!reporterPhone || !incidentType || !description || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required report fields' },
        { status: 400 }
      );
    }

    // Deduplication check via localId if provided
    if (localId) {
      const existing = await CrowdReport.findOne({ localId });
      if (existing) {
        return NextResponse.json({
          success: true,
          data: existing,
          message: 'Report already processed',
        });
      }
    }

    const referenceId = generateReferenceId();

    const newReport = await CrowdReport.create({
      referenceId,
      localId: localId || undefined,
      reporterPhone,
      incidentType,
      description,
      userSeverity: userSeverity || 'HIGH',
      roadBlocked: !!roadBlocked,
      peopleNearby: !!peopleNearby,
      buildingsNearby: !!buildingsNearby,
      location,
      images: images || [],
      status: 'RECEIVED',
      source: 'PWA',
    });

    return NextResponse.json(
      {
        success: true,
        data: newReport,
        message: 'Report created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/v1/reports POST]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const query: any = {};
    if (phone) {
      query.reporterPhone = phone;
    }

    const reports = await CrowdReport.find(query).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    console.error('[API /api/v1/reports GET]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
