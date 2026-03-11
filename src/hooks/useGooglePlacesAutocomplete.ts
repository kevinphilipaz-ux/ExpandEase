import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript, isGoogleMapsConfigured } from '../utils/loadGoogleMapsScript';

export interface UseGooglePlacesAutocompleteOptions {
  /** Called when user selects a place from the dropdown. */
  onPlaceSelect: (formattedAddress: string) => void;
  /** Restrict to region codes (e.g. ['us']). Default: US only. */
  includedRegionCodes?: string[];
  /** Only run when this is true. */
  enabled?: boolean;
  /**
   * When true (default), on mobile use the classic Autocomplete dropdown below the input
   * instead of PlaceAutocompleteElement, to avoid full-screen takeover and scroll-to-top.
   */
  useInlineOnMobile?: boolean;
}

const MOBILE_BREAKPOINT = 768;
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

/**
 * Mount Google PlaceAutocompleteElement (new API) on desktop, or classic Autocomplete on mobile
 * so the dropdown stays below the address bar without full-screen takeover or scroll-to-top.
 * Returns useFallback: true when using plain input + classic Autocomplete (mobile) or when API is unavailable.
 */
export function useGooglePlacesAutocomplete(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseGooglePlacesAutocompleteOptions
) {
  const { onPlaceSelect, includedRegionCodes = ['us'], enabled = true, useInlineOnMobile = true } = options;
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;
  const elementRef = useRef<HTMLElement | unknown>(null);
  const [useFallback, setUseFallback] = useState(() => useInlineOnMobile && isMobile());

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    let cancelled = false;
    const useClassicOnMobile = useInlineOnMobile && isMobile();
    if (useClassicOnMobile) {
      setUseFallback(true);
    }
    if (!isGoogleMapsConfigured()) {
      setUseFallback(true);
      if (!useClassicOnMobile) return;
    }

    let fallbackTimer: number | null = null;

    loadGoogleMapsScript()
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const google = window.google;
        if (!google?.maps?.importLibrary) return;

        // Mobile: use classic Autocomplete so dropdown appears below the bar (no full-screen, no scroll-to-top)
        if (useClassicOnMobile) {
          const placesLib = await (google.maps.importLibrary as (lib: string) => Promise<{ Autocomplete?: new (input: HTMLInputElement, opts?: { componentRestrictions?: { country: string | string[] } }) => { getPlace: () => { formatted_address?: string }; addListener: (event: string, fn: () => void) => void } }>)('places');
          const Autocomplete = placesLib?.Autocomplete;
          if (!Autocomplete) {
            setUseFallback(true);
            return;
          }
          const tryAttach = () => {
            const input = containerRef.current?.querySelector('input');
            if (!input || cancelled) return;
            const componentRestrictions = includedRegionCodes?.length
              ? { country: includedRegionCodes as string[] }
              : undefined;
            const autocomplete = new Autocomplete(input, { componentRestrictions });
            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              const addr = place?.formatted_address;
              if (addr) onPlaceSelectRef.current(addr);
            });
            elementRef.current = autocomplete as unknown as HTMLElement;
          };
          tryAttach();
          if (!elementRef.current) requestAnimationFrame(() => tryAttach());
          return;
        }

        const places = google?.maps?.places as { PlaceAutocompleteElement?: new (opts?: { includedRegionCodes?: string[] }) => HTMLElement } | undefined;
        const PlaceAutocompleteElement = places?.PlaceAutocompleteElement;
        if (!PlaceAutocompleteElement) {
          setUseFallback(true);
          if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) console.warn('[Google Places] PlaceAutocompleteElement not found. Use v=weekly and ensure Places API is enabled.');
          return;
        }
        // PlaceAutocompleteElement uses closed Shadow DOM; force open so we can remove the blue focus ring from the inner input
        const originalAttachShadow = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function (init: ShadowRootInit) {
          return originalAttachShadow.call(this, { ...init, mode: 'open' });
        };
        const el = new PlaceAutocompleteElement({ includedRegionCodes }) as HTMLElement;
        el.setAttribute('class', 'gmp-place-autocomplete-input');
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(el);
        Element.prototype.attachShadow = originalAttachShadow;

        const injectFocusRingRemoval = (root: ShadowRoot) => {
          if (root.querySelector('style[data-gmp-focus-fix]')) return;
          const style = root.appendChild(document.createElement('style'));
          style.setAttribute('data-gmp-focus-fix', '');
          style.textContent = `
            input:focus, input:focus-visible,
            [tabindex]:focus, [tabindex]:focus-visible { outline: none !important; box-shadow: none !important; }
          `;
        };
        const root = el.shadowRoot;
        if (root) injectFocusRingRemoval(root);
        else requestAnimationFrame(() => { if (el.shadowRoot && !cancelled) injectFocusRingRemoval(el.shadowRoot); });
        elementRef.current = el;

        const handleSelect = async (ev: { placePrediction?: { toPlace?: () => { fetchFields: (opts: { fields: string[] }) => Promise<void>; formattedAddress?: string; toJSON?: () => Record<string, unknown> } } }) => {
          const placePrediction = ev?.placePrediction;
          if (!placePrediction?.toPlace) return;
          try {
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['formattedAddress'] });
            const addr = (place as { formattedAddress?: string }).formattedAddress ?? (place.toJSON?.() as { formattedAddress?: string } | undefined)?.formattedAddress;
            if (addr) onPlaceSelectRef.current(addr);
          } catch {
            // ignore
          }
        };

        el.addEventListener('gmp-select', handleSelect as EventListener);

        // If the key is restricted (e.g. wrong referrer on Vercel), the widget may render but the input can be missing or disabled. Fall back to plain input after a short delay.
        fallbackTimer = window.setTimeout(() => {
          if (cancelled || !containerRef.current) return;
          const input = el.shadowRoot?.querySelector?.('input');
          if (!input || input.disabled) {
            setUseFallback(true);
            const current = elementRef.current;
            if (current instanceof HTMLElement && containerRef.current?.contains(current)) {
              current.remove();
            }
            elementRef.current = null;
          }
        }, 1000);
      })
      .catch((err) => {
        setUseFallback(true);
        if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV && err?.message) {
          console.warn('[Google Places]', err.message);
        }
      });

    return () => {
      cancelled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      const el = elementRef.current;
      if (el instanceof HTMLElement && containerRef.current?.contains(el)) {
        el.remove();
      }
      elementRef.current = null;
    };
  }, [enabled, includedRegionCodes?.join(','), useInlineOnMobile]);

  return { useFallback };
}
