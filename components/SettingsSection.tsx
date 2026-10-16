import type { ComponentProps } from '@swell/apps-sdk/components';

export const config = {
  description: 'A divider with a heading and description, to split the settings page into sections',
};

/**
 * Swell's settings layout has no divider or heading field: groups become tabs
 * and a group inside a group stacks its children without tabs. This draws a
 * line, a heading and a short description between settings fields instead.
 *
 * Swell keeps about 40px of space above every component (field spacing plus
 * an empty label), so the same space below the line keeps the break even.
 *
 * Params: `title` (the heading) and `description` (optional, shown under it).
 */

const STYLE = `
  html, body { margin: 0; overflow: hidden; }
  .ss { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border-top: 1px solid #e5e5e5; padding-top: 40px; }
  .ss .title { font-size: 14px; font-weight: 500; color: #171717; line-height: 20px; }
  .ss .description { margin-top: 2px; font-size: 12px; color: #737373; line-height: 18px; }
`;

export default function SettingsSection({ params }: ComponentProps) {
  const title = typeof params.title === 'string' ? params.title : '';
  const description = typeof params.description === 'string' ? params.description : '';

  return (
    <div className="ss">
      <style>{STYLE}</style>
      {title && <div className="title">{title}</div>}
      {description && <div className="description">{description}</div>}
    </div>
  );
}
