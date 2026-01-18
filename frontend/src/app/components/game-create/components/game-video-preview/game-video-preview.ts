import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ensureHttpsUrl } from '@app/shared/utils/https-url';

type VideoPreview =
  | { kind: 'none' }
  | { kind: 'embed'; safeUrl: SafeResourceUrl; label: string }
  | { kind: 'video'; url: string }
  | { kind: 'unsupported' };

@Component({
  selector: 'app-game-video-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-video-preview.html',
  styleUrl: './game-video-preview.scss',
})
// Role : Afficher un apercu de la video des regles a partir d'une URL.
// Préconditions : `videoUrl` contient une URL valide ou vide.
// Postconditions : Un embed, un lecteur video ou un message est affiche selon le format.
export class GameVideoPreviewComponent {
  readonly videoUrl = input<string>('');
  private readonly sanitizer = inject(DomSanitizer);

  readonly preview = computed<VideoPreview>(() => {
    const normalized = this.normalizeUrl(this.videoUrl());
    if (!normalized) {
      return { kind: 'none' };
    }

    const youtubeId = this.extractYouTubeId(normalized);
    if (youtubeId) {
      const url = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
      return {
        kind: 'embed',
        safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
        label: 'YouTube',
      };
    }

    const vimeoId = this.extractVimeoId(normalized);
    if (vimeoId) {
      const url = `https://player.vimeo.com/video/${vimeoId}`;
      return {
        kind: 'embed',
        safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
        label: 'Vimeo',
      };
    }

    if (this.isDirectVideo(normalized)) {
      return { kind: 'video', url: normalized };
    }

    return { kind: 'unsupported' };
  });

  private extractYouTubeId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\\./, '');
      if (host === 'youtu.be') {
        return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        const idFromQuery = parsed.searchParams.get('v');
        if (idFromQuery) return idFromQuery;
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'v') {
          return parts[1] ?? null;
        }
        if (parts[0] === 'live') {
          return parts[1] ?? null;
        }
      }
      if (host === 'youtube-nocookie.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts[0] === 'embed') {
          return parts[1] ?? null;
        }
      }
    } catch {
      return this.extractYouTubeIdFromText(url);
    }
    return this.extractYouTubeIdFromText(url);
  }

  private extractYouTubeIdFromText(text: string): string | null {
    const match = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{6,})/i,
    );
    return match?.[1] ?? null;
  }

  private extractVimeoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\\./, '');
      if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const numeric = parts.find((part) => /^\\d+$/.test(part));
      return numeric ?? null;
    } catch {
      return null;
    }
  }

  private isDirectVideo(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg');
  }

  private normalizeUrl(raw: string): string {
    const trimmed = ensureHttpsUrl(raw);
    if (!trimmed) return '';
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }
}
