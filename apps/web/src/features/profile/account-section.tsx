'use client';

import { MIN_AGE, SIGNUP_INTERESTS, type Me, type MePatch } from '@newstart/shared';
import { Button, Input, Select } from '@newstart/ui';
import { useId, useState } from 'react';
import { AvatarPicker } from '../../shared/avatar/avatar-picker';
import { UserAvatar } from '../../shared/avatar/user-avatar';
import { ChoiceChips } from '../../shared/choice-chips';
import fr from '../../shared/i18n/fr.json';

const t = fr.profile.account;
const ta = fr.avatar;
const MAX_INTERESTS = 8;
const INTEREST_CHOICES = SIGNUP_INTERESTS.map((value) => ({
  value,
  label: fr.signup.interests[value],
}));

/** Rubrique « Mon compte » : prénom, année de naissance et centres d'intérêt. Chacun s'enregistre à part. */
export function AccountSection({
  me,
  onSave,
}: {
  me: Me;
  onSave: (patch: MePatch) => Promise<void> | void;
}) {
  const nameId = useId();
  const yearId = useId();
  const [name, setName] = useState(me.firstName);
  const [choosing, setChoosing] = useState(false);
  const trimmed = name.trim();
  const nameValid = trimmed.length >= 2 && trimmed.length <= 30;
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 88 }, (_, i) => thisYear - MIN_AGE - i);
  // Une année déjà enregistrée reste choisissable même si elle sort de la liste.
  if (me.birthYear !== null && !years.includes(me.birthYear)) years.push(me.birthYear);

  if (choosing) {
    return (
      <AvatarPicker
        value={me.avatar}
        name={me.firstName}
        onSave={(avatar) => onSave({ avatar })}
        onClose={() => setChoosing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <UserAvatar avatar={me.avatar} name={me.firstName} className="size-16 rounded-2xl" />
        <Button type="button" variant="outline" onClick={() => setChoosing(true)}>
          {ta.change}
        </Button>
      </div>

      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (nameValid && trimmed !== me.firstName) void onSave({ firstName: trimmed });
        }}
      >
        <label htmlFor={nameId} className="text-[15px] font-semibold">
          {t.firstName}
        </label>
        <div className="flex gap-2">
          <Input
            id={nameId}
            value={name}
            maxLength={30}
            autoComplete="given-name"
            aria-invalid={nameValid ? undefined : true}
            aria-describedby={nameValid ? undefined : `${nameId}-note`}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={!nameValid || trimmed === me.firstName}>
            {t.save}
          </Button>
        </div>
        {!nameValid && (
          <p id={`${nameId}-note`} className="text-sm text-danger">
            {t.firstNameError}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={yearId} className="text-[15px] font-semibold">
          {t.birthYear}
        </label>
        <Select
          id={yearId}
          autoComplete="bday-year"
          value={me.birthYear ?? ''}
          onChange={(e) => void onSave({ birthYear: Number(e.target.value) })}
        >
          {me.birthYear === null && (
            <option value="" disabled>
              {t.birthYearPlaceholder}
            </option>
          )}
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
        <p className="text-[13px] text-text-muted">{t.birthYearHint}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold">{t.interests}</h2>
        <p className="text-[13px] text-text-muted">{t.interestsHint}</p>
        <ChoiceChips
          legend={t.interests}
          choices={INTEREST_CHOICES}
          value={me.interests}
          max={MAX_INTERESTS}
          layout="pills"
          onChange={(next) => void onSave({ interests: next as Me['interests'] })}
        />
      </div>
    </div>
  );
}
