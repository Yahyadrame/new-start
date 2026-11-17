'use client';

import 'flag-icons/css/flag-icons.min.css';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@newstart/ui';
import { ChevronDown } from 'lucide-react';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/max';
import { useState } from 'react';
import fr from '../../shared/i18n/fr.json';

const t = fr.signup;
export const DEFAULT_COUNTRY: CountryCode = 'SN';
const names = new Intl.DisplayNames(['fr'], { type: 'region' });

const dialOf = (code: CountryCode) => `+${getCountryCallingCode(code)}`;

export type Country = { code: CountryCode; name: string; dial: string };
export const COUNTRIES: Country[] = getCountries()
  .map((code) => ({
    code,
    name: names.of(code) ?? code,
    dial: dialOf(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const SENEGAL: Country = { code: 'SN', name: 'Sénégal', dial: '+221' };

/** Numéro en E.164 quand il est valide pour le pays choisi ; sinon la saisie brute, que le schéma refusera. */
export function composePhone(national: string, country: CountryCode): string {
  const typed = national.trim();
  if (!typed || typed.startsWith('+')) return typed;
  return parsePhoneNumberFromString(typed, country)?.number ?? `${dialOf(country)}${typed}`;
}

type Props = {
  id: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
};

export function PhoneField({ id, onChange, onBlur, invalid, describedBy }: Props) {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);

  function update(nextNational: string, nextCountry: CountryCode) {
    setNational(nextNational);
    setCountry(nextCountry);
    onChange(composePhone(nextNational, nextCountry));
  }
  const current = COUNTRIES.find((c) => c.code === country) ?? SENEGAL;

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={t.countryLabel
            .replace('{pays}', current.name)
            .replace('{indicatif}', current.dial)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-surface-1 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <span className={`fi fi-${country.toLowerCase()} text-[20px]`} aria-hidden="true" />
          <span>{current.dial}</span>
          <ChevronDown aria-hidden="true" className="size-4 text-text-muted" />
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput aria-label={t.countrySearch} placeholder={t.countrySearch} />
            <CommandList>
              <CommandEmpty className="px-3 py-4 text-[14px] text-text-muted">
                {t.countryEmpty}
              </CommandEmpty>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.dial}`}
                  onSelect={() => {
                    update(national, c.code);
                    setOpen(false);
                  }}
                >
                  <span
                    className={`fi fi-${c.code.toLowerCase()} text-[20px]`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-text-muted">{c.dial}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        type="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => update(e.target.value, country)}
        onBlur={onBlur}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
      />
    </div>
  );
}
