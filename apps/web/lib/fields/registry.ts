import { z } from 'zod';
import {
  Type,
  AlignLeft,
  Hash,
  ToggleLeft,
  Link as LinkIcon,
  Mail,
  Image as ImageIcon,
  ListChecks,
  ListPlus,
  Palette,
  Calendar,
  TextCursorInput,
  Layers as LayersIcon,
  Group as GroupIcon,
  type LucideIcon,
} from 'lucide-react';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'url'
  | 'email'
  | 'image'
  | 'select'
  | 'multiselect'
  | 'color'
  | 'date'
  | 'repeater'
  | 'group';

export interface FieldDefinition {
  type: FieldType;
  label: string;
  description: string;
  icon: LucideIcon;
  configSchema: z.ZodSchema;
  defaultConfig: Record<string, unknown>;
}

const baseConfig = {
  required: z.boolean().default(false),
  helpText: z.string().max(280).optional(),
};

const textField: FieldDefinition = {
  type: 'text',
  label: 'Text',
  description: 'Single-line plain text.',
  icon: Type,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.string().optional(),
    maxLength: z.number().int().positive().optional(),
  }),
  defaultConfig: { required: false },
};

const textareaField: FieldDefinition = {
  type: 'textarea',
  label: 'Textarea',
  description: 'Multi-line plain text.',
  icon: AlignLeft,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.string().optional(),
    maxLength: z.number().int().positive().optional(),
    rows: z.number().int().positive().default(4),
  }),
  defaultConfig: { required: false, rows: 4 },
};

const numberField: FieldDefinition = {
  type: 'number',
  label: 'Number',
  description: 'Integer or decimal value.',
  icon: Hash,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  defaultConfig: { required: false },
};

const booleanField: FieldDefinition = {
  type: 'boolean',
  label: 'Boolean',
  description: 'True / false toggle.',
  icon: ToggleLeft,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.boolean().default(false),
  }),
  defaultConfig: { required: false, defaultValue: false },
};

const urlField: FieldDefinition = {
  type: 'url',
  label: 'URL',
  description: 'Validated URL.',
  icon: LinkIcon,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.string().url().optional(),
  }),
  defaultConfig: { required: false },
};

const emailField: FieldDefinition = {
  type: 'email',
  label: 'Email',
  description: 'Validated email address.',
  icon: Mail,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.string().email().optional(),
  }),
  defaultConfig: { required: false },
};

const imageField: FieldDefinition = {
  type: 'image',
  label: 'Image',
  description: 'Single uploaded image.',
  icon: ImageIcon,
  configSchema: z.object({
    ...baseConfig,
    aspectRatioHint: z.string().optional(),
  }),
  defaultConfig: { required: false },
};

const selectField: FieldDefinition = {
  type: 'select',
  label: 'Select',
  description: 'Single choice from a fixed list.',
  icon: ListChecks,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z.string().optional(),
    options: z
      .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
      .min(1, 'At least one option is required'),
  }),
  defaultConfig: { required: false, options: [] },
};

const richtextField: FieldDefinition = {
  type: 'richtext',
  label: 'Rich text',
  description: 'Formatted text (bold, headings, links). Outputs HTML.',
  icon: TextCursorInput,
  configSchema: z.object({ ...baseConfig }),
  defaultConfig: { required: false },
};

const multiselectField: FieldDefinition = {
  type: 'multiselect',
  label: 'Multi-select',
  description: 'Pick zero or more from a fixed list.',
  icon: ListPlus,
  configSchema: z.object({
    ...baseConfig,
    options: z
      .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
      .min(1, 'At least one option is required'),
  }),
  defaultConfig: { required: false, options: [] },
};

const colorField: FieldDefinition = {
  type: 'color',
  label: 'Color',
  description: 'Hex color picker.',
  icon: Palette,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Use #RRGGBB hex')
      .optional(),
  }),
  defaultConfig: { required: false },
};

const dateField: FieldDefinition = {
  type: 'date',
  label: 'Date',
  description: 'Calendar date (no time).',
  icon: Calendar,
  configSchema: z.object({
    ...baseConfig,
    defaultValue: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .optional(),
  }),
  defaultConfig: { required: false },
};

const repeaterField: FieldDefinition = {
  type: 'repeater',
  label: 'Repeater',
  description: 'Repeating list of grouped fields (testimonials, FAQs, features…).',
  icon: LayersIcon,
  configSchema: z.object({
    ...baseConfig,
    minItems: z.number().int().nonnegative().optional(),
    maxItems: z.number().int().positive().optional(),
    children: z
      .array(
        z.object({
          id: z.string().min(1),
          slug: z.string().min(1),
          label: z.string().min(1),
          type: z.string().min(1),
          config: z.record(z.unknown()).default({}),
        })
      )
      .default([]),
  }),
  defaultConfig: { required: false, children: [] },
};

const groupField: FieldDefinition = {
  type: 'group',
  label: 'Group',
  description: 'Single nested object of related fields.',
  icon: GroupIcon,
  configSchema: z.object({
    ...baseConfig,
    children: z
      .array(
        z.object({
          id: z.string().min(1),
          slug: z.string().min(1),
          label: z.string().min(1),
          type: z.string().min(1),
          config: z.record(z.unknown()).default({}),
        })
      )
      .default([]),
  }),
  defaultConfig: { required: false, children: [] },
};

export const FIELD_REGISTRY: Record<FieldType, FieldDefinition> = {
  text: textField,
  textarea: textareaField,
  richtext: richtextField,
  number: numberField,
  boolean: booleanField,
  url: urlField,
  email: emailField,
  image: imageField,
  select: selectField,
  multiselect: multiselectField,
  color: colorField,
  date: dateField,
  repeater: repeaterField,
  group: groupField,
};

export type FieldChild = {
  id: string;
  slug: string;
  label: string;
  type: string;
  config: Record<string, unknown>;
};


export function getFieldDefinition(type: string): FieldDefinition | null {
  return (FIELD_REGISTRY as Record<string, FieldDefinition>)[type] ?? null;
}

export const FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'richtext',
  'number',
  'boolean',
  'url',
  'email',
  'image',
  'select',
  'multiselect',
  'color',
  'date',
];
