/**
 * Database Seed Script
 *
 * Clears all collections and seeds fresh data:
 * - Admin user
 * - Dummy users with worship data
 * - AI configuration with default providers
 *
 * Run with: pnpm seed:db
 */
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/db';
import { User } from '@/modules/user/user.model';
import { AIConfig } from '@/modules/ai/ai-config.model';
import { ChatSession } from '@/modules/ai/chat/chat-session.model';
import { ChatMessage } from '@/modules/ai/chat/chat-message.model';
import { SalahDay } from '@/modules/salah/salah.model';
import { QuranDay } from '@/modules/quran/quran.model';
import { DhikrDay } from '@/modules/dhikr/dhikr.model';
import { Habit, HabitDay } from '@/modules/habit/habit.model';
import { ChecklistDay } from '@/modules/checklist/checklist.model';
import { AuditEvent } from '@/modules/audit/audit.model';
import { ModerationFlag } from '@/modules/moderation/moderation.model';
import {
  PRAYER_NAMES,
  SALAH_DEFAULT_POINTS,
  type PrayerStatus,
} from '@/modules/salah/salah.constants';
import { DEFAULT_DHIKR_PRESETS } from '@/modules/dhikr/dhikr.constants';
import type { AuditAction } from '@/modules/audit/audit.interface';

// Seed configuration
const SEED_CONFIG = {
  // Admin credentials (from environment or defaults)
  adminEmail: process.env.ADMIN_EMAIL || 'admin@ibadah.app',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345',
  adminName: process.env.ADMIN_NAME || 'Ibadah Admin',

  // Dummy users
  userCount: 20,

  // Data generation
  daysOfHistory: 30,
};

interface SeedStats {
  users: number;
  salahDays: number;
  quranDays: number;
  dhikrDays: number;
  habits: number;
  habitDays: number;
  checklistDays: number;
  chatSessions: number;
  auditEvents: number;
}

/** UTC midnight Date for `offset` days ago — matches how day docs are keyed. */
function dayKeyAt(offset: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function fardPoints(status: PrayerStatus): number {
  switch (status) {
    case 'on_time_awwal':
      return SALAH_DEFAULT_POINTS.fardAwwal;
    case 'on_time_mid':
      return SALAH_DEFAULT_POINTS.fardMid;
    case 'on_time_last':
      return SALAH_DEFAULT_POINTS.fardLast;
    case 'late':
      return SALAH_DEFAULT_POINTS.fardLate;
    case 'missed':
      return SALAH_DEFAULT_POINTS.fardMissed;
    default:
      return 0;
  }
}

async function clearCollections(): Promise<void> {
  console.log('🗑️  Clearing collections...');

  const collections: mongoose.Model<unknown>[] = [
    User,
    SalahDay,
    QuranDay,
    DhikrDay,
    Habit,
    HabitDay,
    ChecklistDay,
    ChatSession,
    ChatMessage,
    AuditEvent,
    ModerationFlag,
    AIConfig,
  ] as unknown as mongoose.Model<unknown>[];

  for (const collection of collections) {
    await collection.deleteMany({});
  }

  console.log('✅ All collections cleared');
}

type SeedProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini';

interface SeedProviderMeta {
  displayName: string;
  defaultModel: string;
  availableModels: string[];
  rateLimitTier: 'free' | 'standard' | 'premium';
  envKey: string;
}

/**
 * Static provider metadata. API keys and the active provider/model come from
 * the environment at seed time; `.env` then remains the runtime fallback
 * (see `getAiConfig` in `modules/ai/ai.config.ts`).
 */
const AI_PROVIDER_DEFAULTS: Record<SeedProviderName, SeedProviderMeta> = {
  openrouter: {
    displayName: 'OpenRouter',
    defaultModel: 'openai/gpt-4o-mini',
    availableModels: [
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'nvidia/nemotron-3-super-120b-a12b:free',
    ],
    rateLimitTier: 'free',
    envKey: 'OPENROUTER_API_KEY',
  },
  openai: {
    displayName: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    availableModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    rateLimitTier: 'standard',
    envKey: 'OPENAI_API_KEY',
  },
  anthropic: {
    displayName: 'Anthropic',
    defaultModel: 'claude-3-5-haiku-20241022',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    rateLimitTier: 'standard',
    envKey: 'ANTHROPIC_API_KEY',
  },
  gemini: {
    displayName: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    availableModels: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    rateLimitTier: 'free',
    envKey: 'GEMINI_API_KEY',
  },
};

const AI_PROVIDER_NAMES = Object.keys(AI_PROVIDER_DEFAULTS) as SeedProviderName[];

function parseSeedProvider(raw: string | undefined): SeedProviderName {
  const lower = (raw ?? '').trim().toLowerCase();
  return (AI_PROVIDER_NAMES as string[]).includes(lower)
    ? (lower as SeedProviderName)
    : 'openrouter';
}

function parseSeedNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw !== undefined && raw !== '' && Number.isFinite(n) ? n : fallback;
}

async function seedAIConfig(): Promise<void> {
  console.log('🔧 Seeding AI configuration from environment...');

  const activeProvider = parseSeedProvider(process.env.AI_PROVIDER);
  const envModel = process.env.AI_MODEL?.trim();
  const maxTokens = parseSeedNumber(process.env.AI_MAX_TOKENS, 1024);
  const temperature = parseSeedNumber(process.env.AI_TEMPERATURE, 0.4);
  const siteName = process.env.AI_SITE_NAME?.trim() || 'Ibadah';
  const siteUrl = process.env.AI_SITE_URL?.trim() || undefined;
  const genericKey = process.env.AI_API_KEY?.trim();

  const providers = AI_PROVIDER_NAMES.map((name) => {
    const meta = AI_PROVIDER_DEFAULTS[name];
    const isActive = name === activeProvider;

    // Provider-specific key wins; AI_API_KEY is a fallback for the active provider.
    const apiKey =
      process.env[meta.envKey]?.trim() || (isActive ? genericKey : undefined) || undefined;

    // The active provider honors the AI_MODEL override.
    const defaultModel = isActive && envModel ? envModel : meta.defaultModel;

    // Ensure the chosen model is selectable in the admin UI dropdown.
    const availableModels = meta.availableModels.includes(defaultModel)
      ? meta.availableModels
      : [defaultModel, ...meta.availableModels];

    return {
      name,
      displayName: meta.displayName,
      enabled: Boolean(apiKey),
      apiKey,
      defaultModel,
      availableModels,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      maxTokens,
      rateLimitTier: meta.rateLimitTier,
    };
  });

  const topLevelModel = envModel || AI_PROVIDER_DEFAULTS[activeProvider].defaultModel;

  const config = new AIConfig({
    activeProvider,
    defaultModel: topLevelModel,
    maxTokens,
    temperature,
    siteName,
    siteUrl,
    providers,
  });

  // pre-save hook derives apiKeyLastFour for display.
  await config.save();

  console.log('✅ AI configuration seeded:');
  console.log(`   Active provider: ${config.activeProvider} (${topLevelModel})`);
  config.providers.forEach((p) => {
    const keyState = p.apiKey ? `🔑 ****${p.apiKeyLastFour ?? ''}` : 'no key';
    console.log(
      `   - ${p.displayName}: ${p.enabled ? '✅ enabled' : '❌ disabled'} (${keyState})`,
    );
  });

  if (!config.providers.some((p) => p.enabled)) {
    console.warn(
      '⚠️  No AI provider has an API key set. Add one to .env (e.g. OPENROUTER_API_KEY) ' +
        'or configure it in the admin panel at /ai-settings.',
    );
  }
}

async function seedAdminUser(): Promise<mongoose.Types.ObjectId> {
  console.log('👤 Creating admin user...');

  const passwordHash = await bcrypt.hash(SEED_CONFIG.adminPassword, env.BCRYPT_SALT_ROUNDS);

  const admin = await User.create({
    email: SEED_CONFIG.adminEmail,
    name: SEED_CONFIG.adminName,
    passwordHash,
    role: 'admin',
    suspended: false,
    locale: 'en',
    timezone: 'UTC',
    lastActiveAt: new Date(),
  });

  console.log(`✅ Admin user created: ${admin.email}`);
  return admin._id;
}

async function seedDummyUsers(): Promise<mongoose.Types.ObjectId[]> {
  console.log(`👥 Creating ${SEED_CONFIG.userCount} dummy users...`);

  const userIds: mongoose.Types.ObjectId[] = [];
  const passwordHash = await bcrypt.hash('password123', env.BCRYPT_SALT_ROUNDS);

  for (let i = 0; i < SEED_CONFIG.userCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const user = await User.create({
      email: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(),
      name: `${firstName} ${lastName}`,
      passwordHash,
      role: 'user',
      suspended: false,
      locale: faker.helpers.arrayElement(['en', 'ar', 'bn'] as const),
      timezone: faker.helpers.arrayElement([
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Dubai',
      ]),
      lastActiveAt: faker.date.recent({ days: 30 }),
    });

    userIds.push(user._id);
  }

  console.log(`✅ Created ${userIds.length} dummy users`);
  return userIds;
}

async function seedSalahDays(userIds: mongoose.Types.ObjectId[]): Promise<number> {
  console.log('🕌 Creating Salah (prayer) day records...');

  let count = 0;
  const statuses: PrayerStatus[] = [
    'on_time_awwal',
    'on_time_mid',
    'on_time_last',
    'late',
    'missed',
    'pending',
  ];

  for (const userId of userIds) {
    for (let dayOffset = 0; dayOffset < SEED_CONFIG.daysOfHistory; dayOffset++) {
      // Skip some days randomly to simulate real usage
      if (Math.random() < 0.15) continue;

      const prayers: Record<string, unknown> = {};
      let totalPoints = 0;

      for (const name of PRAYER_NAMES) {
        const status = faker.helpers.arrayElement(statuses);
        prayers[name] = {
          fard: { status },
          sunnahBefore: faker.datatype.boolean(),
          sunnahAfter: faker.datatype.boolean(),
          nafl: faker.datatype.boolean(),
        };
        totalPoints += fardPoints(status);
      }

      const witr = faker.datatype.boolean();
      if (witr) totalPoints += SALAH_DEFAULT_POINTS.witr;

      await SalahDay.create({
        user: userId,
        date: dayKeyAt(dayOffset),
        prayers,
        witr,
        totalPoints,
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} Salah day records`);
  return count;
}

async function seedQuranDays(userIds: mongoose.Types.ObjectId[]): Promise<number> {
  console.log('📖 Creating Quran reading day records...');

  let count = 0;

  for (const userId of userIds) {
    for (let dayOffset = 0; dayOffset < SEED_CONFIG.daysOfHistory; dayOffset++) {
      // Skip days randomly
      if (Math.random() < 0.3) continue;

      const surahFrom = faker.number.int({ min: 1, max: 114 });
      const ayahFrom = faker.number.int({ min: 1, max: 10 });

      await QuranDay.create({
        user: userId,
        date: dayKeyAt(dayOffset),
        pagesRead: faker.number.int({ min: 1, max: 10 }),
        minutesRead: faker.number.int({ min: 5, max: 60 }),
        surahFrom,
        ayahFrom,
        surahTo: surahFrom,
        ayahTo: ayahFrom + faker.number.int({ min: 5, max: 20 }),
        notes: Math.random() < 0.2 ? faker.lorem.sentence() : undefined,
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} Quran day records`);
  return count;
}

async function seedDhikrDays(userIds: mongoose.Types.ObjectId[]): Promise<number> {
  console.log('📿 Creating Dhikr day records...');

  let count = 0;

  for (const userId of userIds) {
    for (let dayOffset = 0; dayOffset < SEED_CONFIG.daysOfHistory; dayOffset++) {
      if (Math.random() < 0.25) continue;

      const entries = DEFAULT_DHIKR_PRESETS.map((preset) => ({
        slug: preset.slug,
        label: preset.label,
        arabic: preset.arabic,
        target: preset.defaultTarget,
        count: faker.number.int({ min: 0, max: preset.defaultTarget }),
      }));

      await DhikrDay.create({
        user: userId,
        date: dayKeyAt(dayOffset),
        entries,
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} Dhikr day records`);
  return count;
}

async function seedHabits(
  userIds: mongoose.Types.ObjectId[],
): Promise<{ habits: number; habitDays: number }> {
  console.log('✨ Creating Habits...');

  let habitsCount = 0;
  let habitDaysCount = 0;

  const habitTemplates = [
    { name: 'Morning Fajr Prayer', description: 'Wake up for Fajr prayer' },
    { name: 'Read Quran', description: 'Read at least 1 page of Quran' },
    { name: 'Morning Adhkar', description: 'Say morning remembrance' },
    { name: 'Evening Adhkar', description: 'Say evening remembrance' },
    { name: 'Help Parents', description: 'Help parents with household tasks' },
    { name: 'Exercise', description: 'Physical exercise for 30 minutes' },
    { name: 'Drink Water', description: 'Drink 8 glasses of water' },
    { name: 'Charity', description: 'Give charity daily' },
    { name: 'Learn Islam', description: 'Study Islamic knowledge' },
    { name: 'Call Family', description: 'Check on family members' },
  ];

  for (const userId of userIds) {
    const userHabitCount = faker.number.int({ min: 3, max: 7 });
    const templates = faker.helpers.arrayElements(habitTemplates, userHabitCount);

    const habitIds: mongoose.Types.ObjectId[] = [];
    const habitRewards = new Map<string, number>();

    for (const template of templates) {
      const rewardPoints = faker.number.int({ min: 1, max: 10 });
      const habit = await Habit.create({
        user: userId,
        name: template.name,
        description: template.description,
        rewardPoints,
        archived: false,
      });
      habitIds.push(habit._id);
      habitRewards.set(habit._id.toString(), rewardPoints);
      habitsCount++;
    }

    // Create one HabitDay per active day with completion entries.
    for (let dayOffset = 0; dayOffset < SEED_CONFIG.daysOfHistory; dayOffset++) {
      if (Math.random() < 0.3) continue;

      const entries = habitIds.map((habit) => ({
        habit,
        completed: Math.random() < 0.8,
      }));

      const totalPoints = entries
        .filter((entry) => entry.completed)
        .reduce((sum, entry) => sum + (habitRewards.get(entry.habit.toString()) ?? 0), 0);

      await HabitDay.create({
        user: userId,
        date: dayKeyAt(dayOffset),
        entries,
        totalPoints,
      });
      habitDaysCount++;
    }
  }

  console.log(`✅ Created ${habitsCount} Habits and ${habitDaysCount} habit day records`);
  return { habits: habitsCount, habitDays: habitDaysCount };
}

async function seedChecklistDays(userIds: mongoose.Types.ObjectId[]): Promise<number> {
  console.log('✅ Creating Checklist Days...');

  let count = 0;

  for (const userId of userIds) {
    for (let dayOffset = 0; dayOffset < SEED_CONFIG.daysOfHistory; dayOffset++) {
      if (Math.random() < 0.2) continue;

      const itemsCount = faker.number.int({ min: 3, max: 7 });
      const items = Array.from({ length: itemsCount }, () => ({
        title: faker.lorem.words({ min: 2, max: 4 }),
        rewardPoints: faker.number.int({ min: 1, max: 10 }),
        completed: faker.datatype.boolean(),
        notes: Math.random() < 0.2 ? faker.lorem.sentence() : undefined,
      }));

      const totalPoints = items
        .filter((item) => item.completed)
        .reduce((sum, item) => sum + item.rewardPoints, 0);

      await ChecklistDay.create({
        user: userId,
        date: dayKeyAt(dayOffset),
        items,
        totalPoints,
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} Checklist Days`);
  return count;
}

async function seedChatSessions(userIds: mongoose.Types.ObjectId[]): Promise<number> {
  console.log('💬 Creating Chat Sessions...');

  let count = 0;

  for (const userId of userIds) {
    const sessionCount = faker.number.int({ min: 0, max: 3 });

    for (let i = 0; i < sessionCount; i++) {
      const surface = faker.helpers.arrayElement(['dashboard', 'admin'] as const);

      const session = await ChatSession.create({
        userId,
        title: faker.lorem.sentence({ min: 2, max: 4 }),
        surface,
        messageCount: 0,
        lastMessageAt: new Date(),
      });

      const messageCount = faker.number.int({ min: 2, max: 8 });
      for (let j = 0; j < messageCount; j++) {
        await ChatMessage.create({
          sessionId: session._id,
          role: j % 2 === 0 ? 'user' : 'assistant',
          content:
            j % 2 === 0 ? faker.lorem.sentence({ min: 3, max: 8 }) : faker.lorem.paragraph(),
        });
      }

      session.messageCount = messageCount;
      await session.save();

      count++;
    }
  }

  console.log(`✅ Created ${count} Chat Sessions with messages`);
  return count;
}

async function seedAuditEvents(adminId: mongoose.Types.ObjectId): Promise<number> {
  console.log('📊 Generating audit events...');

  const auditActions: AuditAction[] = [
    'auth.admin.login',
    'auth.admin.logout',
    'user.update',
    'defaults.update',
  ];

  let count = 0;
  for (let i = 0; i < 20; i++) {
    await AuditEvent.create({
      actor: {
        id: adminId,
        email: SEED_CONFIG.adminEmail,
        name: SEED_CONFIG.adminName,
        ip: faker.internet.ipv4(),
      },
      action: faker.helpers.arrayElement(auditActions),
      target: {
        type: 'System',
        id: new mongoose.Types.ObjectId().toString(),
        label: faker.lorem.words(2),
      },
      context: {
        description: faker.lorem.sentence(),
      },
    });
    count++;
  }

  console.log(`✅ Created ${count} audit events`);
  return count;
}

async function run(): Promise<void> {
  console.log('🌱 Starting database seed...');
  console.log('');

  try {
    await connectDatabase();
    await clearCollections();
    await seedAIConfig();

    const adminId = await seedAdminUser();
    const userIds = await seedDummyUsers();

    const stats: SeedStats = {
      users: userIds.length + 1,
      salahDays: await seedSalahDays(userIds),
      quranDays: await seedQuranDays(userIds),
      dhikrDays: await seedDhikrDays(userIds),
      habits: 0,
      habitDays: 0,
      checklistDays: await seedChecklistDays(userIds),
      chatSessions: await seedChatSessions(userIds),
      auditEvents: await seedAuditEvents(adminId),
    };

    const habitResult = await seedHabits(userIds);
    stats.habits = habitResult.habits;
    stats.habitDays = habitResult.habitDays;

    console.log('');
    console.log('📊 Seed Statistics:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Salah Days: ${stats.salahDays}`);
    console.log(`   Quran Days: ${stats.quranDays}`);
    console.log(`   Dhikr Days: ${stats.dhikrDays}`);
    console.log(`   Habits: ${stats.habits}`);
    console.log(`   Habit Days: ${stats.habitDays}`);
    console.log(`   Checklist Days: ${stats.checklistDays}`);
    console.log(`   Chat Sessions: ${stats.chatSessions}`);
    console.log(`   Audit Events: ${stats.auditEvents}`);

    console.log('');
    console.log('✅ Database seed completed successfully!');
    console.log('');
    console.log('Admin Credentials:');
    console.log(`  Email: ${SEED_CONFIG.adminEmail}`);
    console.log(`  Password: ${SEED_CONFIG.adminPassword}`);
    console.log('');
    console.log('All dummy users have password: "password123"');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

// Run if executed directly. Use pathToFileURL so the comparison works on
// Windows (where process.argv[1] is a backslash drive path, not a file URL).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}

export { run as seedDatabase };
