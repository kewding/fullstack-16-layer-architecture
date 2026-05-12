import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  medicalInfoService,
  type MedicalInfoData,
} from '@/features/user/pages/medical-info/services/medical-info.service';
import {
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Loader2,
  ShieldPlus,
  UserRound,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Gluten',
];

const COMMON_CONDITIONS = [
  'Asthma',
  'Diabetes (Type 1)',
  'Diabetes (Type 2)',
  'Hypertension',
  'Heart disease',
  'Epilepsy',
  'Anemia',
  'Thyroid disorder',
  'Kidney disease',
  'Arthritis',
];

const COMMON_MEDICATIONS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Metformin',
  'Amlodipine',
  'Losartan',
  'Omeprazole',
  'Cetirizine',
  'Salbutamol',
  'Insulin',
];

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[hsl(var(--border))]">
        <div className="w-9 h-9 rounded-full bg-[#d6ede9] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#3f6f64]" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            {title}
          </h2>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium border transition-all text-white
                ${
                  active
                    ? 'bg-[#d6ede9] text-[#3f6f64] border-[#d6ede9]'
                    : 'border-[hsl(var(--border))] text-muted-foreground hover:border-[#3f6f64] hover:text-[#3f6f64]'
                }
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (val: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();

    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }

    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="bg-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTag}
          className="border-[hsl(var(--border))]"
        >
          Add
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              className="flex items-center gap-1 pr-1 bg-[#d6ede9] text-[#3f6f64] hover:bg-[#d6ede9]"
            >
              {tag}

              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export const MedicalInformationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MedicalInfoData>({
    blood_type: '',
    height_cm: 0,
    weight_kg: 0,
    allergens: [],
    custom_allergens: [],
    medical_conditions: [],
    medications: [],
    emergency_contact_name: '',
    emergency_contact_number: '',
    emergency_contact_relationship: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await medicalInfoService.getMedicalInfo();
        setForm(data);
      } catch {
        setError('Failed to load medical information');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await medicalInfoService.upsertMedicalInfo(form);
      setSuccess(true);
    } catch {
      setError('Failed to save medical information');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof MedicalInfoData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex px-1 w-full">
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin text-[#3f6f64]" />
          Loading medical information…
        </div>
      </div>
    );
  }

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Medical Information
            </h1>

            <p className="text-sm text-muted-foreground">
              Keep your medical profile updated for emergencies and clinic visits.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#3f6f64] hover:bg-[#355c53] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Information'
            )}
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-[#d6ede9] bg-[#eef8f5] px-4 py-3 text-sm text-[#3f6f64]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Medical information saved successfully.
          </div>
        )}

        {/* Vitals */}
        <SectionCard title="Vitals" icon={HeartPulse}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Blood Type</Label>

              <Select
                value={form.blood_type}
                onValueChange={(val) => update('blood_type', val)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>

                <SelectContent>
                  {BLOOD_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Height (cm)</Label>

              <Input
                type="number"
                placeholder="e.g. 165"
                className="bg-white"
                value={form.height_cm || ''}
                onChange={(e) =>
                  update('height_cm', parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Weight (kg)</Label>

              <Input
                type="number"
                placeholder="e.g. 60"
                className="bg-white"
                value={form.weight_kg || ''}
                onChange={(e) =>
                  update('weight_kg', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </SectionCard>

        {/* Allergens */}
        <SectionCard title="Allergens" icon={ShieldPlus}>
          <div className="flex flex-col gap-6">
            <CheckboxGroup
              label="Common Allergens"
              options={COMMON_ALLERGENS}
              selected={form.allergens}
              onChange={(val) => update('allergens', val)}
            />

            <TagInput
              label="Other Allergens"
              placeholder="Type an allergen and press Enter"
              tags={form.custom_allergens}
              onChange={(val) => update('custom_allergens', val)}
            />
          </div>
        </SectionCard>

        {/* Medical Conditions */}
        <SectionCard title="Medical Conditions" icon={AlertCircle}>
          <CheckboxGroup
            label="Select all that apply"
            options={COMMON_CONDITIONS}
            selected={form.medical_conditions}
            onChange={(val) => update('medical_conditions', val)}
          />
        </SectionCard>

        {/* Medications */}
        <SectionCard title="Current Medications" icon={CheckCircle2}>
          <CheckboxGroup
            label="Select all that apply"
            options={COMMON_MEDICATIONS}
            selected={form.medications}
            onChange={(val) => update('medications', val)}
          />
        </SectionCard>

        {/* Emergency Contact */}
        <SectionCard title="Emergency Contact" icon={UserRound}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Full Name</Label>

              <Input
                placeholder="Contact person's full name"
                className="bg-white"
                value={form.emergency_contact_name}
                onChange={(e) =>
                  update('emergency_contact_name', e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Contact Number</Label>

              <Input
                placeholder="09123456789"
                className="bg-white"
                value={form.emergency_contact_number}
                onChange={(e) =>
                  update('emergency_contact_number', e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Relationship</Label>

              <Input
                placeholder="e.g. Parent, Guardian, Sibling"
                className="bg-white"
                value={form.emergency_contact_relationship}
                onChange={(e) =>
                  update('emergency_contact_relationship', e.target.value)
                }
              />
            </div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
};