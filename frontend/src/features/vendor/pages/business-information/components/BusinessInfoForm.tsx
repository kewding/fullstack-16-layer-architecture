import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  vendorInfoService,
  type BusinessInfoData,
} from '@/features/vendor/services/vendor-info.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { businessInfoSchema, type BusinessInfoInput } from '../schemas/business-info.schema';

type DocType = 'business_address' | 'barangay' | 'mayors_permit';

const DOC_LABELS: Record<DocType, string> = {
  business_address: 'Proof of Business Address',
  barangay: 'Barangay Clearance',
  mayors_permit: "Mayor's Business Permit",
};

function DocumentUpload({
  docType,
  currentUrl,
  onUploaded,
}: {
  docType: DocType;
  currentUrl: string | null;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await vendorInfoService.uploadDocument(docType, file);
      setReplacing(false);
      onUploaded();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFilename = (url: string) => {
    const parts = url.split('/');
    const raw = parts[parts.length - 1];
    return decodeURIComponent(raw.split('?')[0]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{DOC_LABELS[docType]}</Label>

      {currentUrl && !replacing ? (
        // ── Uploaded state ──
        <div className="flex items-center gap-2 border border-green-500/30 bg-green-500/5 rounded-md px-3 py-2.5">
          {/* PDF icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded bg-red-500/10 shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17.5v-1h7v1h-7zm0-3v-1h7v1h-7zm0-3v-1h4v1h-4z" />
            </svg>
          </div>

          {/* filename */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-medium text-white truncate">
              {getFilename(currentUrl)}
            </span>
            <span className="text-xs text-green-400">Uploaded</span>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 underline hover:text-blue-300 transition-colors"
            >
              View
            </a>
            <span className="text-neutral-600">|</span>
            <button
              type="button"
              onClick={() => setReplacing(true)}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        // ── Upload / Replace state ──
        <div className="flex flex-col gap-1.5">
          {replacing && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Select a new PDF to replace the existing document
              </span>
              <button
                type="button"
                onClick={() => setReplacing(false)}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* hidden native input */}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          {/* custom upload button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-3 border border-dashed border-neutral-600 hover:border-neutral-400 rounded-md px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded bg-neutral-800 shrink-0">
              {uploading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-white">
                {uploading ? 'Uploading...' : 'Choose PDF file'}
              </span>
              <span className="text-xs text-muted-foreground">PDF only, max 10MB</span>
            </div>
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export function BusinessInfoForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoData | null>(null);

  const form = useForm<BusinessInfoInput>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: { dti_sec_number: '', tin: '' },
  });

  const loadData = async () => {
    try {
      const data = await vendorInfoService.getBusinessInfo();
      setBusinessInfo(data);
      form.reset({
        dti_sec_number: data.dti_sec_number ?? '',
        tin: data.tin ?? '',
      });
    } catch {
      setError('Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: BusinessInfoInput) => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await vendorInfoService.updateBusinessInfo(data);
      setSuccess(true);
    } catch {
      setError('Failed to save business information');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
        Loading...
      </div>
    );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">Business Information</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">Saved successfully.</p>}

      {/* Registration Numbers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="dti_sec_number">DTI BNRS / SEC Number</Label>
            {businessInfo?.is_dti_verified && (
              <Badge variant="default" className="text-xs">
                Verified
              </Badge>
            )}
          </div>
          <Input
            id="dti_sec_number"
            placeholder="DTI or SEC registration number"
            {...form.register('dti_sec_number')}
          />
          {form.formState.errors.dti_sec_number && (
            <span className="text-red-500 text-xs">
              {form.formState.errors.dti_sec_number.message}
            </span>
          )}
          <p className="text-xs text-muted-foreground">
            Verify at DTI BNRS or SEC i-View. Admin will confirm registration status.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="tin">TIN</Label>
            {businessInfo?.is_tin_verified && (
              <Badge variant="default" className="text-xs">
                Verified
              </Badge>
            )}
          </div>
          <Input id="tin" placeholder="Tax Identification Number" {...form.register('tin')} />
          {form.formState.errors.tin && (
            <span className="text-red-500 text-xs">{form.formState.errors.tin.message}</span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Business Info'}
        </Button>
      </div>

      {/* Document Uploads */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Supporting Documents</h3>
          {businessInfo?.is_documents_verified && (
            <Badge variant="default" className="text-xs">
              All Verified
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload PDF files only. Maximum file size: 10MB per document.
        </p>

        <DocumentUpload
          docType="business_address"
          currentUrl={businessInfo?.proof_of_business_address_url ?? null}
          onUploaded={loadData}
        />
        <DocumentUpload
          docType="barangay"
          currentUrl={businessInfo?.barangay_clearance_url ?? null}
          onUploaded={loadData}
        />
        <DocumentUpload
          docType="mayors_permit"
          currentUrl={businessInfo?.mayors_permit_url ?? null}
          onUploaded={loadData}
        />
      </div>
    </form>
  );
}
