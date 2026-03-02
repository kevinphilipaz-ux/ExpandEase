import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, DollarSign } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { useGooglePlacesAutocomplete } from '../../hooks/useGooglePlacesAutocomplete';

interface AddressCardProps {
  onNext: () => void;
}

export function AddressCard({ onNext }: AddressCardProps) {
  const { data, updateData } = useOnboarding();
  const [address, setAddress] = useState(data.address);
  const [income, setIncome] = useState(data.income);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  useGooglePlacesAutocomplete(addressContainerRef, {
    onPlaceSelect: (formattedAddress) => setAddress(formattedAddress),
    enabled: true,
  });

  const formatIncome = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim().length > 5) {
      updateData({ address: address.trim(), income });
      onNext();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center">
        Let's start with the basics.
      </h2>
      <p className="text-gray-400 text-center mb-8">
        Your address and income help us build an accurate analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Address: Google PlaceAutocompleteElement; overflow-visible + z-index so dropdown isn't clipped */}
        <div className="relative z-[100] overflow-visible">
          <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-3 block" htmlFor="address-onboarding">
            Property Address
          </label>
          <div className="relative flex items-center bg-gray-900/50 border border-white/10 rounded-xl overflow-visible shadow-xl backdrop-blur-sm">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-500 transition-colors z-10 pointer-events-none" size={22} />
            <div ref={addressContainerRef} className="flex-1 min-w-0 [&_.gmp-place-autocomplete-input]:!w-full [&_.gmp-place-autocomplete-input]:!py-5 [&_.gmp-place-autocomplete-input]:!pl-11 [&_.gmp-place-autocomplete-input]:!pr-4 [&_.gmp-place-autocomplete-input]:!text-lg [&_.gmp-place-autocomplete-input]:!bg-transparent [&_.gmp-place-autocomplete-input]:!border-0 [&_.gmp-place-autocomplete-input]:!text-white [&_.gmp-place-autocomplete-input]:!focus:ring-2 [&_.gmp-place-autocomplete-input]:!focus:ring-pink-500/50" style={{ minHeight: 56 }} />
          </div>
          <input type="hidden" id="address-onboarding" name="address" value={address} readOnly aria-hidden="true" />
          <p className="text-gray-500 text-xs mt-2 ml-1">
            We'll pull your current home value & zoning data from this.
          </p>
        </div>

        {/* Income Slider */}
        <div className="bg-gray-900/50 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <label className="text-gray-400 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
              <DollarSign size={14} className="text-purple-400" />
              Household Income
            </label>
            <span className="text-purple-400 font-mono font-bold text-xl">
              {formatIncome(income)}
            </span>
          </div>
          <input
            type="range"
            min="50000"
            max="500000"
            step="10000"
            value={income}
            onChange={(e) => setIncome(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>$50k</span>
            <span>$500k+</span>
          </div>
        </div>

        {/* Continue Button (shown when an address has been selected) */}
        {address.trim().length > 5 &&
        <motion.button
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          type="submit"
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-pink-500/20 transition-all flex items-center justify-center gap-2 group">

            Continue
            <ArrowRight
            className="group-hover:translate-x-1 transition-transform"
            size={20} />

          </motion.button>
        }
      </form>
    </div>
  );
}
