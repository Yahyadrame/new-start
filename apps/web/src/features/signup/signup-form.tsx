'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SIGNUP_GOALS } from '@newstart/shared';
import { Button, Input } from '@newstart/ui';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import fr from '../../shared/i18n/fr.json';
import { savePendingSignup } from './pending-signup';
import { requestCode } from './request-code';
import { SignupFormSchema, type SignupFormInput, type SignupFormValues } from './signup-schema';

const t = fr.signup;
type TextField = 'firstName' | 'phone' | 'birthYear' | 'email';
type Consent = 'acceptTerms' | 'smsOptIn' | 'voiceConsent';

const TEXT_FIELDS: { name: TextField; type: string; autoComplete: string; hint?: string }[] = [
  { name: 'firstName', type: 'text', autoComplete: 'given-name' },
  { name: 'phone', type: 'tel', autoComplete: 'tel', hint: t.phoneHint },
  { name: 'birthYear', type: 'text', autoComplete: 'bday-year' },
  { name: 'email', type: 'email', autoComplete: 'email', hint: t.emailHint },
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
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: { smsOptIn: false, voiceConsent: false },
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

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {TEXT_FIELDS.map(({ name, type, autoComplete, hint }) => (
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
      ))}

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
      </div>

      <FieldError id="server-note">{failed && t.errors.server}</FieldError>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? t.sending : t.submit}
      </Button>
    </form>
  );
}
