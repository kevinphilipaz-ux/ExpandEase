import { useState, useEffect, useCallback } from 'react';
import {
  fetchPropertyValue,
  getMockPropertyData,
  isPropertyApiConfigured,
  type SubjectProperty,
  type CompProperty,
  type PropertyDataResult,
} from '../services/propertyApi';

export interface UsePropertyDataResult {
  subject: SubjectProperty;
  comps: CompProperty[];
  loading: boolean;
  error: string | null;
  isRealData: boolean;
  retry: () => void;
}

const DEFAULT_SUBJECT: SubjectProperty = {
  value: 0,
  equity: 0,
  sqft: 0,
  beds: 0,
  baths: 0,
  pool: false,
  yearBuilt: 0,
};

export function usePropertyData(address: string): UsePropertyDataResult {
  const [result, setResult] = useState<PropertyDataResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(async () => {
    const effectiveAddress = (address || '').trim();
    if (effectiveAddress.length < 5) {
      const mock = getMockPropertyData('512 N 41st St, Phoenix, AZ 85018');
      setResult(mock);
      setLoading(false);
      setError(null);
      setIsRealData(false);
      return;
    }

    setLoading(true);
    setError(null);
    const apiConfigured = isPropertyApiConfigured();
    const data = await fetchPropertyValue(effectiveAddress);

    if (data) {
      setResult(data);
      setIsRealData(true);
      setError(null);
    } else {
      const mock = getMockPropertyData(effectiveAddress);
      setResult(mock);
      setIsRealData(false);
      if (apiConfigured) {
        setError('Could not load property data. Using estimates.');
      }
    }
    setLoading(false);
  }, [address, retryCount]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const subject = result?.subject ?? DEFAULT_SUBJECT;
  const comps = result?.comps ?? [];

  return { subject, comps, loading, error, isRealData, retry };
}
