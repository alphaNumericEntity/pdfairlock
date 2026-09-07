import type { Metadata } from "next";
import { CompetitorPage } from "@/components/competitor-page";
import { mustGetCompetitor } from "@/lib/competitors";

const competitor = mustGetCompetitor("adobe-acrobat-alternative");
export const metadata: Metadata = {
  title: competitor.metaTitle,
  description: competitor.metaDescription,
  alternates: { canonical: `/${competitor.slug}` },
};

export default function Page() {
  return <CompetitorPage competitor={competitor} />;
}
