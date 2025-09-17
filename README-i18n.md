# i18n Integration (next-intl)
- Default locale: **de**
- Locales: **de**, **tr**, **en**
- Added: `messages/`, `src/lib/i18n.ts`, `middleware.ts`, `src/components/LocaleSwitcher.tsx`
- Migrated: `app/layout.tsx` → `app/[locale]/layout.tsx` (original backed up as `app/_layout.backup.tsx`)
- Moved: `app/page.tsx` → `app/[locale]/page.tsx` (root page now redirects to `/de`)

## Usage
- Use `useTranslations("home")` etc. in client components.
- Place `<LocaleSwitcher />` anywhere (e.g. in Navbar) to switch languages.

> Note: If you previously hardcoded `lang="tr"` in `<html>`, it's now dynamic per locale.
