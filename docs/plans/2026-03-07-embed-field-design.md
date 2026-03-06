# EmbedField Design

## Scope

Dashboard editor EmbedField only (public rendering excluded).

## Decision Log

- Client-side URL pattern parsing (no oEmbed / server API)
- URL only stored in DB (existing `EmbedBlockData { url, provider? }`)
- Unsupported URLs displayed as clickable links
- Provider-specific dimensions: YouTube 16:9, SoundCloud height 166px
- Initial providers: YouTube + SoundCloud, extensible via provider registry

## Structure

```
src/lib/embed/
  types.ts       - EmbedProvider, ParsedEmbed types
  providers.ts   - youtube, soundcloud definitions + providers array
  parse.ts       - parseEmbedUrl(url): ParsedEmbed | null

src/app/dashboard/components/ContentPanel/shared-fields/
  EmbedField.tsx - URL input + iframe preview (modified)
```

## Types

```typescript
interface EmbedProvider {
    name: string;
    displayName: string;
    regex: RegExp[];
    toEmbedUrl: (match: RegExpMatchArray) => string;
    dimensions: { aspectRatio: string } | { height: number };
}

interface ParsedEmbed {
    provider: string;
    displayName: string;
    embedUrl: string;
    dimensions: { aspectRatio: string } | { height: number };
}
```

## Providers

- **YouTube**: `youtube.com/watch?v=ID`, `youtu.be/ID` -> `youtube.com/embed/ID` (16:9)
- **SoundCloud**: `soundcloud.com/user/track` -> `w.soundcloud.com/player/?url=...` (h:166px)

## EmbedField Behavior

1. URL input -> `parseEmbedUrl(url)`
2. Parse success -> iframe preview (provider-specific size) + provider auto-saved
3. Parse failure (unsupported URL) -> clickable external link
4. Empty value -> input only

## Changes

1. **New**: `lib/embed/` module (3 files)
2. **Modified**: `EmbedField.tsx` - value type `string` -> `EmbedBlockData`, add iframe preview
3. **Modified**: `CustomEntryEditor.tsx` - pass `EmbedBlockData` to EmbedField

## DB/Type Changes

None. `EmbedBlockData { url: string; provider?: string }` already exists.
