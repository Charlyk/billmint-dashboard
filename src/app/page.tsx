import { getSession } from "@/lib/services/auth.service";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const { user } = await getSession();

  return <LandingPage user={user} />;
}
