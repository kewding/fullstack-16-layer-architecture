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
import { X } from 'lucide-react';
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
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selected.includes(option)
                ? 'bg-white text-black border-white'
                : 'border-neutral-600 text-neutral-400 hover:border-neutral-400 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
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
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-400 transition-colors"
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

  if (loading)
    return (
      <div className="flex px-1 w-full">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          Loading...
        </div>
      </div>
    );

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        <h1 className="text-2xl font-semibold">Medical Information</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">Saved successfully.</p>}

        {/* Vitals */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold border-b border-neutral-800 pb-2">Vitals</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Blood Type</Label>
              <Select value={form.blood_type} onValueChange={(val) => update('blood_type', val)}>
                <SelectTrigger>
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
                value={form.height_cm || ''}
                onChange={(e) => update('height_cm', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                placeholder="e.g. 60"
                value={form.weight_kg || ''}
                onChange={(e) => update('weight_kg', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </section>

        {/* Allergens */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold border-b border-neutral-800 pb-2">Allergens</h2>
          <CheckboxGroup
            label="Common Allergens"
            options={COMMON_ALLERGENS}
            selected={form.allergens}
            onChange={(val) => update('allergens', val)}
          />
          <TagInput
            label="Other Allergens"
            placeholder="Type an allergen and press Enter or Add"
            tags={form.custom_allergens}
            onChange={(val) => update('custom_allergens', val)}
          />
        </section>

        {/* Medical Conditions */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold border-b border-neutral-800 pb-2">
            Medical Conditions
          </h2>
          <CheckboxGroup
            label="Select all that apply"
            options={COMMON_CONDITIONS}
            selected={form.medical_conditions}
            onChange={(val) => update('medical_conditions', val)}
          />
        </section>

        {/* Medications */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold border-b border-neutral-800 pb-2">
            Current Medications
          </h2>
          <CheckboxGroup
            label="Select all that apply"
            options={COMMON_MEDICATIONS}
            selected={form.medications}
            onChange={(val) => update('medications', val)}
          />
        </section>

        {/* Emergency Contact */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold border-b border-neutral-800 pb-2">
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="Contact person's full name"
                value={form.emergency_contact_name}
                onChange={(e) => update('emergency_contact_name', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Contact Number</Label>
              <Input
                placeholder="09123456789"
                value={form.emergency_contact_number}
                onChange={(e) => update('emergency_contact_number', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Relationship</Label>
              <Input
                placeholder="e.g. Parent, Guardian, Sibling"
                value={form.emergency_contact_relationship}
                onChange={(e) => update('emergency_contact_relationship', e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Medical Information'}
          </Button>
        </div>
      </main>
    </div>
  );
};
