const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'src', 'app');

const TARGET_DIRS = [
  path.join(APP_DIR, 'features'),
  path.join(APP_DIR, 'components'),
  path.join(APP_DIR, 'pages'),
  path.join(APP_DIR, 'guards'),
  path.join(APP_DIR, 'directives'),
  path.join(APP_DIR, 'interceptors'),
  path.join(APP_DIR, 'layouts'),
];

const ALLOWED_MATCHERS = [
  /src[\\/]app[\\/]core[\\/]auth[\\/]data-access[\\/]session\.service\.ts$/,
  /src[\\/]app[\\/]services[\\/]auth\.ts$/,
];

const BANNED_RULES = [
  {
    pattern: /from\s+['"][^'"]*\/services\/auth['"]/,
    reason: 'import directo de AuthService legacy',
  },
  {
    pattern: /from\s+['"]\.\/auth['"]/,
    reason: 'import relativo de AuthService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/project['"]/,
    reason: 'import directo de ProjectService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/evidence(?:\.service)?['"]/,
    reason: 'import directo de EvidenceService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/milestone\.service['"]/,
    reason: 'import directo de MilestoneService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/assignment\.service['"]/,
    reason: 'import directo de AssignmentService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/project-access\.service['"]/,
    reason: 'import directo de ProjectAccessService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/admin\.service['"]/,
    reason: 'import directo de AdminService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/activity\.service['"]/,
    reason: 'import directo de ActivityService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/reminder\.service['"]/,
    reason: 'import directo de ReminderService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/version\.service['"]/,
    reason: 'import directo de VersionService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/notification\.service['"]/,
    reason: 'import directo de NotificationService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/search\.service['"]/,
    reason: 'import directo de SearchService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/review\.service['"]/,
    reason: 'import directo de ReviewService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/editor-ws\.service['"]/,
    reason: 'import directo de EditorWsService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/god-alerts\.service['"]/,
    reason: 'import directo de GodAlertsService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/theme\.service['"]/,
    reason: 'import directo de ThemeService legacy',
  },
  {
    pattern: /from\s+['"][^'"]*\/services\/admin-ui-preferences\.service['"]/,
    reason: 'import directo de AdminUiPreferencesService legacy',
  },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      fullPath.endsWith('.ts') &&
      !fullPath.endsWith('.spec.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

if (!fs.existsSync(APP_DIR)) {
  console.error('[check:layers] No se encontró src/app.');
  process.exit(1);
}

const files = TARGET_DIRS.flatMap((dir) => walk(dir));
const violations = [];

for (const file of files) {
  if (ALLOWED_MATCHERS.some((matcher) => matcher.test(file))) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of BANNED_RULES) {
      if (rule.pattern.test(line)) {
        violations.push({
          file: path.relative(ROOT, file),
          line: index + 1,
          text: line.trim(),
          reason: rule.reason,
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error('[check:layers] Violaciones de arquitectura detectadas:');
  for (const item of violations) {
    console.error(
      `- ${item.file}:${item.line} (${item.reason}) -> ${item.text}`,
    );
  }
  process.exit(1);
}

console.log('[check:layers] OK: no hay imports prohibidos en capas frontend.');
