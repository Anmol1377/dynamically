import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const epoch = sql`(unixepoch())`;

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().notNull().$default(() => 1),
  siteName: text('site_name').notNull().default('My Site'),
  publicReadEnabled: integer('public_read_enabled', { mode: 'boolean' }).notNull().default(false),
  setupComplete: integer('setup_complete', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(epoch),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor'] }).notNull().default('editor'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(epoch),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
}, (t) => ({
  userIdx: index('idx_sessions_user').on(t.userId),
  expiresIdx: index('idx_sessions_expires').on(t.expiresAt),
}));

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(epoch),
});

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(epoch),
}, (t) => ({
  pageOrderIdx: index('idx_sections_page').on(t.pageId, t.order),
  pageSlugUnique: uniqueIndex('uniq_sections_page_slug').on(t.pageId, t.slug),
}));

export const fields = sqliteTable('fields', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  order: integer('order').notNull().default(0),
  config: text('config', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(epoch),
}, (t) => ({
  sectionOrderIdx: index('idx_fields_section').on(t.sectionId, t.order),
  sectionSlugUnique: uniqueIndex('uniq_fields_section_slug').on(t.sectionId, t.slug),
}));

export const contentValues = sqliteTable('content_values', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  version: text('version', { enum: ['draft', 'published'] }).notNull(),
  value: text('value', { mode: 'json' }).$type<unknown>(),
  updatedByUserId: text('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(epoch),
}, (t) => ({
  fieldVersionUnique: uniqueIndex('uniq_content_field_version').on(t.fieldId, t.version),
}));

export const uploads = sqliteTable('uploads', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull().unique(),
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt').notNull().default(''),
  uploadedByUserId: text('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
});

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  scope: text('scope', { enum: ['read', 'preview'] }).notNull().default('read'),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(epoch),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type ContentValue = typeof contentValues.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Settings = typeof settings.$inferSelect;
