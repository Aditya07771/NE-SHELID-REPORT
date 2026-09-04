'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getDemoSession } from '@/lib/auth';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveOfflineReport } from '@/lib/db';
import { reportService } from '@/services/report.service';
import { uploadService } from '@/services/upload.service';

type IncidentType = 'LANDSLIDE' | 'VISIBLE_CRACK' | 'ROAD_BLOCKAGE' | 'ROCKFALL' | 'FLOODING' | 'OTHER_HAZARD';
type UserSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PhotoItem {
  id: string;
  base64: string;
  fileName: string;
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs font-semibold">Loading Report Form...</p>
      </div>
    }>
      <ReportFormContent />
    </Suspense>
  );
}

function ReportFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const { location, loading: geoLoading, error: geoError, captureLocation } = useGeoLocation();

  const [step, setStep] = useState<number>(1);
  const [reporterPhone, setReporterPhone] = useState<string>('');

  // Step 1: Incident Type
  const initialType = (searchParams.get('type') as IncidentType) || 'LANDSLIDE';
  const [incidentType, setIncidentType] = useState<IncidentType>(initialType);

  // Step 2: Location automatically captured via hook on mount/step entry
  // Step 3: Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // Step 4: Incident Details
  const [description, setDescription] = useState<string>('');
  const [userSeverity, setUserSeverity] = useState<UserSeverity>('HIGH');
  const [roadBlocked, setRoadBlocked] = useState<boolean>(false);
  const [peopleNearby, setPeopleNearby] = useState<boolean>(false);
  const [buildingsNearby, setBuildingsNearby] = useState<boolean>(false);

  // Step 5: Submission status
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submittedRefId, setSubmittedRefId] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [isSavedOffline, setIsSavedOffline] = useState<boolean>(false);

  useEffect(() => {
    const session = getDemoSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setReporterPhone(session.phone);
    captureLocation();
  }, [captureLocation, router]);

  // Handle Photo selection & conversion to Base64
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files).slice(0, 5 - photos.length);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [
            ...prev,
            {
              id: uuidv4(),
              base64: reader.result as string,
              fileName: file.name || `photo_${Date.now()}.jpg`,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Final Form Submission
  const handleSubmit = async () => {
    if (!description.trim()) {
      setSubmitError('Please provide a brief description of the hazard.');
      setStep(4);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setIsSavedOffline(false);

    const localId = `local_${uuidv4()}`;

    // Standard location fallback if GPS wasn't acquired
    const finalLocation = location || {
      latitude: 25.5788,
      longitude: 91.8933,
      accuracy: 20,
      capturedAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Upload images using uploadService
        const uploadedImages: Array<{ fileId: string; url: string; thumbnailUrl?: string; fileName?: string }> = [];

        for (const p of photos) {
          const uploaded = await uploadService.uploadImage(p.base64, p.fileName);
          if (uploaded) {
            uploadedImages.push(uploaded);
          }
        }

        // Post report payload to Next.js API / MongoDB
        const payload = {
          localId,
          reporterPhone,
          incidentType,
          description,
          userSeverity,
          roadBlocked,
          peopleNearby,
          buildingsNearby,
          location: finalLocation,
          images: uploadedImages,
        };

        const res = await reportService.createReport(payload);

        if (res.success) {
          setSubmitSuccess(true);
          setSubmittedRefId(res.data?.referenceId || localId);
        } else {
          // If server fails or offline during request, fallback to IndexedDB
          console.warn('[Report] API submit failed, falling back to IndexedDB:', res.error);
          await saveReportToIndexedDB(localId, finalLocation);
        }
      } else {
        // OFFLINE STAGING in IndexedDB
        await saveReportToIndexedDB(localId, finalLocation);
      }
    } catch (err: any) {
      console.error('[Report Submit Error]:', err);
      try {
        await saveReportToIndexedDB(localId, finalLocation);
      } catch (dbErr) {
        setSubmitError(err?.message || 'Failed to save report offline.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const saveReportToIndexedDB = async (localId: string, finalLocation: any) => {
    await saveOfflineReport({
      localId,
      reporterPhone,
      incidentType,
      description,
      userSeverity,
      roadBlocked,
      peopleNearby,
      buildingsNearby,
      location: finalLocation,
      images: photos.map((p) => ({
        localImageId: p.id,
        base64: p.base64,
        fileName: p.fileName,
      })),
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING_SYNC',
    });

    setSubmitSuccess(true);
    setIsSavedOffline(true);
    setSubmittedRefId(`OFFLINE-${localId.substring(6, 12).toUpperCase()}`);
  };

  const hazardTypes: Array<{ type: IncidentType; label: string; icon: string; desc: string }> = [
    { type: 'LANDSLIDE', label: 'Landslide', icon: '🌄', desc: 'Mudslide, slope collapse, debris flow' },
    { type: 'VISIBLE_CRACK', label: 'Visible Crack', icon: '⚡', desc: 'Road crack, wall crack, hillside fissure' },
    { type: 'ROAD_BLOCKAGE', label: 'Road Blockage', icon: '🚧', desc: 'Debris on road, fallen trees or rocks' },
    { type: 'ROCKFALL', label: 'Rockfall', icon: '🪨', desc: 'Falling boulders or rocks on incline' },
    { type: 'FLOODING', label: 'Flooding / Flash Flood', icon: '🌊', desc: 'High water overflow, river swell' },
    { type: 'OTHER_HAZARD', label: 'Other Hazard', icon: '⚠️', desc: 'Any other dangerous slope condition' },
  ];

  if (submitSuccess) {
    return (
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-6 text-center space-y-5 shadow-xs my-4 animate-fadeIn">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm ${
            isSavedOffline
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}
        >
          {isSavedOffline ? '💾' : '✓'}
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900">
            {isSavedOffline ? 'Report Saved Offline' : 'Report Submitted!'}
          </h2>
          <p className="text-xs text-gray-600 font-medium">
            {isSavedOffline
              ? 'Your report is safely stored in IndexedDB and will auto-sync when internet returns.'
              : 'Your report has been received by the NE-SHIELD disaster monitoring center.'}
          </p>
        </div>

        <div className="bg-[#F7FAF8] border border-[#E5EDE8] rounded-2xl p-4 font-mono text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">REFERENCE ID:</span>
            <span className="text-emerald-800 font-bold">{submittedRefId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">STATUS:</span>
            <span className={isSavedOffline ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
              {isSavedOffline ? 'PENDING SYNC' : 'RECEIVED'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">HAZARD:</span>
            <span className="text-gray-800 font-sans">{incidentType.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => router.push('/reports')}
            className="w-full bg-[#F0FDF4] border border-[#DCFCE7] hover:bg-[#DCFCE7] text-emerald-800 font-bold py-3 rounded-xl text-xs transition-colors"
          >
            VIEW MY REPORTS
          </button>
          <button
            onClick={() => router.push('/home')}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-xs transition-colors"
          >
            RETURN TO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Wizard Progress Bar */}
      <div className="bg-white border border-[#E5EDE8] rounded-2xl p-3.5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
          <span className="text-emerald-800 font-mono uppercase">STEP {step} OF 5</span>
          <span className="text-gray-700">
            {step === 1 && 'Hazard Type'}
            {step === 2 && 'GPS Location'}
            {step === 3 && 'Photos'}
            {step === 4 && 'Details & Severity'}
            {step === 5 && 'Review & Submit'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-700 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Non-intrusive Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900">
          <span className="text-amber-600 text-base mt-0.5">📡</span>
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-amber-900">Offline Mode Active</p>
            <p className="text-amber-800/90 leading-relaxed">
              Your report will be saved securely on this device and automatically synced once connection returns.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <span className="font-bold">Error:</span> {submitError}
        </div>
      )}

      {/* STEP 1: Incident Type */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Select Hazard Category</h2>
            <p className="text-xs text-gray-500">Choose the primary type of incident you observed</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {hazardTypes.map((item) => (
              <button
                key={item.type}
                onClick={() => {
                  setIncidentType(item.type);
                  setStep(2);
                }}
                className={`p-4 rounded-2xl text-left border transition-all flex items-center gap-3.5 shadow-xs ${
                  incidentType === item.type
                    ? 'bg-[#F0FDF4] border-emerald-700 ring-1 ring-emerald-700/20'
                    : 'bg-white border-[#E5EDE8] hover:border-gray-300'
                }`}
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{item.label}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                {incidentType === item.type && (
                  <span className="text-emerald-700 font-bold text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: GPS Location */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Capture GPS Position</h2>
            <p className="text-xs text-gray-500">Satellite location coordinates for emergency response teams</p>
          </div>

          <div className="bg-white border border-[#E5EDE8] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">GPS Coordinates</span>
              <button
                onClick={captureLocation}
                disabled={geoLoading}
                className="text-xs bg-[#F0FDF4] hover:bg-[#DCFCE7] text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                {geoLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                    Acquiring...
                  </>
                ) : (
                  <>🔄 Refresh GPS</>
                )}
              </button>
            </div>

            {location ? (
              <div className="bg-[#F7FAF8] border border-[#E5EDE8] rounded-xl p-4 space-y-2.5 font-mono text-xs text-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-400">LATITUDE:</span>
                  <span className="text-gray-900 font-bold">{location.latitude}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">LONGITUDE:</span>
                  <span className="text-gray-900 font-bold">{location.longitude}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ACCURACY:</span>
                  <span className="text-emerald-700 font-bold">± {location.accuracy} meters</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-200">
                  <span>CAPTURED AT:</span>
                  <span>{new Date(location.capturedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs">
                Capturing GPS location...
              </div>
            )}

            {geoError && (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                ⚠️ {geoError}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white border border-[#E5EDE8] hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              BACK
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              NEXT: PHOTOS →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Photos */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload Hazard Photos</h2>
            <p className="text-xs text-gray-500">Capture with camera or choose up to 5 evidence photos</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Camera Trigger */}
              <label className="flex flex-col items-center justify-center p-5 bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl cursor-pointer transition-all text-center shadow-xs">
                <span className="text-3xl mb-1">📷</span>
                <span className="text-xs font-bold text-gray-800">Take Photo</span>
                <span className="text-[10px] text-gray-400">Device Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>

              {/* Gallery Upload */}
              <label className="flex flex-col items-center justify-center p-5 bg-white border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl cursor-pointer transition-all text-center shadow-xs">
                <span className="text-3xl mb-1">🖼️</span>
                <span className="text-xs font-bold text-gray-800">Choose Files</span>
                <span className="text-[10px] text-gray-400">Photo Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ATTACHED PHOTOS ({photos.length}/5):</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="relative rounded-xl overflow-hidden aspect-square border border-gray-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.base64} alt="Hazard preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white border border-[#E5EDE8] hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              BACK
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              NEXT: DETAILS →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Details & Severity */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Hazard Description & Severity</h2>
            <p className="text-xs text-gray-500">Provide observations and risk factors</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Describe the Situation *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Soil sliding on NH-10 near cliff section. Traffic blocked..."
                rows={3}
                className="w-full bg-white border border-[#E5EDE8] rounded-xl p-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Assessed Severity Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as UserSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setUserSeverity(sev)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      userSeverity === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-red-50 border-red-600 text-red-700'
                          : sev === 'HIGH'
                          ? 'bg-orange-50 border-orange-600 text-orange-700'
                          : sev === 'MEDIUM'
                          ? 'bg-amber-50 border-amber-600 text-amber-700'
                          : 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-white border-[#E5EDE8] text-gray-600'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-gray-700">Observed Hazard Impacts</label>
              
              <label className="flex items-center gap-3 bg-white border border-[#E5EDE8] rounded-xl p-3.5 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={roadBlocked}
                  onChange={(e) => setRoadBlocked(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 bg-white border-gray-300 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-gray-800">Road Blocked / Traffic Interrupted</span>
              </label>

              <label className="flex items-center gap-3 bg-white border border-[#E5EDE8] rounded-xl p-3.5 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={peopleNearby}
                  onChange={(e) => setPeopleNearby(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 bg-white border-gray-300 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-gray-800">People / Citizens Nearby or Trapped</span>
              </label>

              <label className="flex items-center gap-3 bg-white border border-[#E5EDE8] rounded-xl p-3.5 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={buildingsNearby}
                  onChange={(e) => setBuildingsNearby(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 bg-white border-gray-300 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-gray-800">Buildings / Infrastructure Threatened</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-white border border-[#E5EDE8] hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              BACK
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              NEXT: REVIEW →
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Submit */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Review & Submit Report</h2>
            <p className="text-xs text-gray-500">Verify all information before final dispatch</p>
          </div>

          <div className="bg-white border border-[#E5EDE8] rounded-2xl p-4 space-y-3 shadow-xs text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">REPORTER PHONE:</span>
              <span className="text-gray-900 font-mono font-bold">{reporterPhone}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">HAZARD CATEGORY:</span>
              <span className="text-emerald-800 font-bold">{incidentType.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">SEVERITY:</span>
              <span className="text-gray-900 font-bold">{userSeverity}</span>
            </div>

            <div className="space-y-1 pb-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium block">DESCRIPTION:</span>
              <p className="text-gray-800 bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex justify-between items-center font-mono">
              <span className="text-gray-500 font-sans">GPS LAT/LNG:</span>
              <span className="text-gray-900">{location ? `${location.latitude}, ${location.longitude}` : 'Captured'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">PHOTOS ATTACHED:</span>
              <span className="text-gray-900 font-bold">{photos.length} photo(s)</span>
            </div>
          </div>

          <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-3.5 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-semibold">CONNECTION STATE:</span>
            <span className={`font-bold ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isOnline ? 'ONLINE (Direct Next.js Submit)' : 'OFFLINE (IndexedDB Local Staging)'}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(4)}
              disabled={submitting}
              className="flex-1 bg-white border border-[#E5EDE8] hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl text-xs shadow-xs"
            >
              BACK
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-xs flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  SUBMITTING...
                </>
              ) : (
                'SUBMIT REPORT 🚀'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
