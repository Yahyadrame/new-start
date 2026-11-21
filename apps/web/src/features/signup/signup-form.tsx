'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SIGNUP_GOALS } from '@newstart/shared';
import { Button, Input, Select } from '@newstart/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import fr from '../../shared/i18n/fr.json';
import { PhoneField } from './phone-field';
import { savePendingSignup } from './pending-signup';
import { requestCode } from './request-code';
import { SignupFormSchema, type SignupFormInput, type SignupFormValues } from './signup-schema';

const t = fr.signup;
type TextField = 'firstName' | 'email';
type Consent = 'acceptTerms' | 'smsOptIn' | 'voiceConsent';

const TEXT_FIELDS: { name: TextField; type: string; autoComplete: string; hint?: string }[] = [
  { name: 'firstName', type: 'text', autoComplete: 'given-name' },
  { name: 'email', type: 'email', autoComplete: 'email', hint: t.emailHint },
];
const THIS_YEAR = new Date().getFullYear();
// De 13 à 100 ans : la liste remplace la saisie libre.
const BIRTH_YEARS = Array.from({ length: 88 }, (_, i) => THIS_YEAR - 13 - i);
const LEGAL_LINKS = [
  { href: '/terms', label: t.termsLink },
  { href: '/privacy', label: t.privacyLink },
];
const CONSENTS: Consent[] = ['acceptTerms', 'smsOptIn', 'voiceConsent'];

function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  return children ? (
    <p id={id} role="alert" className="text-[13px] text-danger">
      {children}
    </p>
  ) : null;
}

export function SignupForm() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: { phone: '', smsOptIn: false, voiceConsent: false },
  });

  async function onSubmit(values: SignupFormValues) {
    setFailed(false);
    try {
      await requestCode(values);
      savePendingSignup(values);
      router.push('/signup/code');
    } catch {
      setFailed(true);
    }
  }

  const renderTextField = ({ name, type, autoComplete, hint }: (typeof TEXT_FIELDS)[number]) => (
    <div key={name} className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[15px] font-semibold">
        {t[name]}
      </label>
      <Input
        id={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`${name}-note`}
        {...register(name)}
      />
      {hint && !errors[name] && <p className="text-[13px] text-text-muted">{hint}</p>}
      <FieldError id={`${name}-note`}>{errors[name] && t.errors[name]}</FieldError>
    </div>
  );

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {TEXT_FIELDS.slice(0, 1).map(renderTextField)}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-[15px] font-semibold">
          {t.phone}
        </label>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneField
              id="phone"
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.phone}
              describedBy="phone-note"
            />
          )}
        />
        {!errors.phone && <p className="text-[13px] text-text-muted">{t.phoneHint}</p>}
        <FieldError id="phone-note">{errors.phone && t.errors.phone}</FieldError>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="birthYear" className="text-[15px] font-semibold">
          {t.birthYear}
        </label>
        <Select
          id="birthYear"
          autoComplete="bday-year"
          defaultValue=""
          aria-invalid={errors.birthYear ? true : undefined}
          aria-describedby="birthYear-note"
          {...register('birthYear')}
        >
          <option value="" disabled>
            {t.birthYearPlaceholder}
          </option>
          {BIRTH_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
        <FieldError id="birthYear-note">{errors.birthYear && t.errors.birthYear}</FieldError>
      </div>

      {TEXT_FIELDS.slice(1).map(renderTextField)}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-[15px] font-semibold">{t.goal}</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {SIGNUP_GOALS.map((goal) => (
            <label key={goal} className="relative cursor-pointer">
              <input type="radio" value={goal} className="peer sr-only" {...register('goal')} />
              <span className="flex min-h-24 flex-col gap-1 rounded-2xl border border-line bg-surface-1 p-4 peer-checked:border-accent peer-checked:bg-surface-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text">
                <span className="text-[15px] font-semibold">{t.goals[goal].label}</span>
                <span className="text-[13px] text-text-muted">{t.goals[goal].hint}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id="goal-note">{errors.goal && t.errors.goal}</FieldError>
      </fieldset>

      <div className="flex flex-col gap-1">
        {CONSENTS.map((name) => (
          <label key={name} className="flex min-h-11 items-start gap-3 py-2 text-[14px]">
            <input type="checkbox" className="mt-0.5 size-5 accent-accent" {...register(name)} />
            <span>{t[name]}</span>
          </label>
        ))}
        <FieldError id="terms-note">{errors.acceptTerms && t.errors.acceptTerms}</FieldError>
        <p className="flex flex-wrap gap-x-4 text-[14px]">
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center font-semibold text-accent-text underline focus-visible:outline-2 focus-visible:outline-accent-text"
            >
              {label}
            </Link>
          ))}
        </p>
      </div>

      <FieldError id="server-note">{failed && t.errors.server}</FieldError>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? t.sending : t.submit}
      </Button>
    </form>
  );
}
