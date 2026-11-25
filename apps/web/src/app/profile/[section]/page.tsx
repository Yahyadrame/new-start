import { notFound } from 'next/navigation';
import { isSection, ProfileScreen, SECTIONS } from '../../../features/profile';

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section }));
}

export default async function ProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  return <ProfileScreen section={section} />;
}
