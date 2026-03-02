/**
 * Load Google Maps JavaScript API using the recommended bootstrap + importLibrary pattern.
 * Uses PlaceAutocompleteElement (new API); required for new customers as of March 2025.
 *
 * Key setup: Enable "Places API" and "Maps JavaScript API", add http://localhost:* for dev.
 */
const API_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;

let loadPromise: Promise<void> | null = null;

/** Bootstrap loader from Google docs - sets up google.maps.importLibrary() */
function getBootstrapScriptKey(): string {
  if (!API_KEY || typeof API_KEY !== 'string') return '';
  return API_KEY.replace(/"/g, '\\"');
}

export function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.google?.maps?.places) return Promise.resolve();
  const key = getBootstrapScriptKey();
  if (!key || key.length < 5) {
    const err = new Error('Missing or invalid VITE_GOOGLE_MAPS_API_KEY');
    if (import.meta.env?.DEV) {
      console.warn('[Google Places]', err.message, 'Add VITE_GOOGLE_MAPS_API_KEY to .env and restart.');
    }
    return Promise.reject(err);
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (window.google?.maps?.places) return;
    if (!window.google?.maps?.importLibrary) {
      const bootstrap = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:"${key}",v:"weekly"});`;
      const script = document.createElement('script');
      script.textContent = bootstrap;
      document.head.appendChild(script);
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    if (!window.google?.maps?.importLibrary) {
      loadPromise = null;
      throw new Error('Google Maps bootstrap failed');
    }
    await (window.google.maps.importLibrary as (lib: string) => Promise<unknown>)('places');
  })();

  return loadPromise;
}

export function isGoogleMapsConfigured(): boolean {
  return !!(API_KEY && typeof API_KEY === 'string' && API_KEY.length >= 5);
}
