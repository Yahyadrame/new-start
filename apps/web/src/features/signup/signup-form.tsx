'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SIGNUP_GOALS, SIGNUP_INTERESTS, SignupProfile } from '@newstart/shared';
import { Button, Input, Select } from '@newstart/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { GoogleButton } from '../../shared/auth/google-button';
import fr from '../../shared/i18n/fr.json';
import { ChoiceChips } from './choice-chips';
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
const STEPS = ['identity', 'goals', 'interests', 'consent'] as const;
// Les champs à vérifier avant de passer à l'étape suivante.
const STEP_FIELDS: (keyof SignupFormInput)[][] = [
  ['firstName', 'phone', 'birthYear', 'email'],
  ['goals'],
  [],
  [],
];
const GOAL_CHOICES = SIGNUP_GOALS.map((value) => ({
  value,
  label: t.goals[value].label,
  hint: t.goals[value].hint,
}));
const INTEREST_CHOICES = SIGNUP_INTERESTS.map((value) => ({ value, label: t.interests[value] }));

const backClass =
  'inline-flex min-h-11 items-center text-[15px] font-medium text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text';

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
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: { phone: '', goals: [], interests: [], smsOptIn: false, voiceConsent: false },
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

  const last = step === STEPS.length - 1;
  const next = async () => {
    if (await trigger(STEP_FIELDS[step] ?? [])) setStep(step + 1);
  };
  // Les étapes restent montées (juste cachées) : le numéro et le reste ne se perdent jamais en revenant.
  const pane = (i: number) => ({ hidden: step !== i, className: 'flex flex-col gap-5' });

  const back =
    step === 0 ? (
      <Link href="/" className={backClass}>
        {t.back}
      </Link>
    ) : (
      <button type="button" onClick={() => setStep(step - 1)} className={backClass}>
        {t.back}
      </button>
    );

  return (
    <>
      <div className="flex items-center gap-4">
        {back}
        <div
          role="img"
          aria-label={t.stepLabel
            .replace('{n}', String(step + 1))
            .replace('{total}', String(STEPS.length))}
          className="flex flex-1 gap-1.5"
        >
          {STEPS.map((name, i) => (
            <span
              key={name}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-surface-2'}`}
            />
          ))}
        </div>
      </div>
      <div>
        <h1 className="font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em]">
          {t.titles[STEPS[step] ?? 'identity']}
        </h1>
        {step === 1 || step === 2 ? (
          <p className="mt-2 text-[15px] text-text-muted">
            {step === 1 ? t.subtitles.goals : t.subtitles.interests}
          </p>
        ) : null}
      </div>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div {...pane(0)}>
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
        </div>

        <div {...pane(1)}>
          <Controller
            control={control}
            name="goals"
            render={({ field }) => (
              <ChoiceChips
                legend={t.goalsLabel}
                choices={GOAL_CHOICES}
                value={field.value}
                max={4}
                onChange={(next) => {
                  field.onChange(next);
                  if (next[0]) setValue('goal', next[0] as SignupFormInput['goal']);
                }}
              />
            )}
          />
          <FieldError id="goal-note">{errors.goals && t.errors.goal}</FieldError>
        </div>

        <div {...pane(2)}>
          <Controller
            control={control}
            name="interests"
            render={({ field }) => (
              <ChoiceChips
                legend={t.interestsLabel}
                choices={INTEREST_CHOICES}
                value={field.value ?? []}
                max={8}
                layout="pills"
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div {...pane(3)}>
          <div className="flex flex-col gap-1">
            {CONSENTS.map((name) => (
              <label key={name} className="flex min-h-11 items-start gap-3 py-2 text-[14px]">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 accent-accent"
                  {...register(name)}
                />
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
        </div>

        <FieldError id="server-note">{failed && t.errors.server}</FieldError>
        {last ? (
          <>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? t.sending : t.submit}
            </Button>
            <GoogleButton
              redirectTo="/onboarding/level"
              getProfile={() => {
                const form = SignupFormSchema.safeParse(getValues());
                // Google fournit l'e-mail : le profil partagé (strict) ne le prend pas.
                const rest = Object.entries(form.success ? form.data : {}).filter(
                  ([key]) => key !== 'email',
                );
                const profile = form.success
                  ? SignupProfile.safeParse(Object.fromEntries(rest))
                  : null;
                return profile?.success ? profile.data : null;
              }}
              onError={setGoogleError}
            />
            <FieldError id="google-note">{googleError}</FieldError>
          </>
        ) : (
          <>
            <Button type="button" size="lg" onClick={() => void next()}>
              {t.next}
            </Button>
            {step === 2 && (
              <Button type="button" variant="ghost" size="lg" onClick={() => setStep(3)}>
                {t.skip}
              </Button>
            )}
          </>
        )}
      </form>
    </>
  );
}
