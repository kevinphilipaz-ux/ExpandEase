/**
 * Types for Google Maps Places (bootstrap + importLibrary, PlaceAutocompleteElement).
 */
declare global {
  interface Window {
    google?: {
      maps: {
        places?: unknown;
        importLibrary?: (lib: string) => Promise<unknown>;
      };
    };
  }
}

/** PlaceAutocompleteElement (new API); created via new google.maps.places.PlaceAutocompleteElement(opts) */
export interface PlaceAutocompleteElement extends HTMLElement {
  addEventListener(
    type: 'gmp-select',
    listener: (ev: { placePrediction: { toPlace: () => Place } }) => void
  ): void;
}

export interface Place {
  fetchFields(opts: { fields: string[] }): Promise<void>;
  formattedAddress?: string;
  toJSON?: () => Record<string, unknown>;
}

export {};
