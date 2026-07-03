// src/i18n/en.ts — English (secondary, fallback to zh if missing)
const en: Record<string, string | ((...args: string[]) => string)> = {
  'os.name':    'ShimmerOS',
  'os.version': 'v3.0.0',
  'os.booting': 'Booting…',
  'os.welcome': 'Welcome back, Shimmer',

  'app.about.label':    'About Me',
  'app.writing.label':  'Blog',
  'app.skills.label':   'Skill Tree',
  'app.projects.label': 'Projects',
  'app.travel.label':   'Travel',
  'app.plan.label':     'February Plan',
  'app.toolbox.label':  'Toolbox',
  'app.links.label':    'Links',
  'app.guestbook.label': 'Guestbook',
  'app.settings.label': 'Settings',
  'app.terminal.label': 'Terminal',

  'app.about.title':    'Player Profile',
  'app.writing.title':  'Blog',
  'app.skills.title':   'Skill Tree',
  'app.projects.title': 'Projects',
  'app.travel.title':   'Travel Footprints',
  'app.plan.title':     'February Plan',
  'app.toolbox.title':  'Toolbox',
  'app.links.title':    'Friend Links',
  'app.guestbook.title': 'Guestbook',
  'app.settings.title': 'System Settings',
  'app.terminal.title': 'ShimmerCMD',

  'about.subtitle': 'Data Analytics & Frontend Explorer',
  'about.bio':      "Hi! I'm Shimmer, studying at Virginia Tech with a focus on statistics and computing. I love telling stories with data and building interactive experiences.",

  'writing.all':      'All',
  'writing.blog':     'Blog',
  'writing.notes':    'Notes',
  'writing.essays':   'Essays',
  'writing.empty':    'Nothing here yet.',
  'writing.readmore': 'Read more →',

  'projects.all':    'All Projects',
  'projects.view':   'View Details',
  'projects.back':   '← Back',
  'projects.demo':   'Demo',
  'projects.source': 'Source',

  'skills.intro':    'Click a node to see details',
  'skills.level':    'Proficiency',
  'skills.related':  'Related Articles',

  'settings.theme':       'Appearance',
  'settings.theme.dark':  'Dark',
  'settings.theme.light': 'Light',
  'settings.accent':      'Accent Color',
  'settings.language':    'Language',
  'settings.lang.zh':     '中文',
  'settings.lang.en':     'English',

  'term.welcome':  'ShimmerOS [v3.0.0]\n(c) 2026 Shimmer. All rights reserved.\n\nType "help" for a list of commands.\n',
  'term.not_found': (cmd: string) => `Command not found: ${cmd}. Type "help" for help.`,
  'term.opening':   (app: string) => `Opening ${app}…`,
  'term.err_open':  (app: string) => `Error: Application "${app}" not found.`,
  'term.rebooting': 'Rebooting system…',
  'term.help': `Available commands:
  help        — Show this help
  ls          — List all apps
  open <app>  — Open an app
  theme <d|l> — Switch theme (dark/light)
  accent <c>  — Change accent color
  sysinfo     — System info
  date        — Show date/time
  contact     — Contact info
  clear       — Clear terminal
  reboot      — Reboot system`,

  'common.close':    'Close',
  'common.minimize': 'Minimize',
  'common.maximize': 'Maximize',
  'common.back':     'Back',
  'common.loading':  'Loading…',
  'common.error':    'Load failed',
  'common.empty':    'Nothing here',
  'common.search.placeholder': 'Search apps, articles, projects…',
};

export default en;
