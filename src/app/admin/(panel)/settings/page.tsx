import { getSettings } from "@/lib/data";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div className="space-y-6">
      <SettingsForm initialSettings={s} />
    </div>
  );
}
