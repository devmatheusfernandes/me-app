import { createClient } from '@/lib/supabase/server';
import { settingsService } from '@/modules/settings/settings.service';
import { SettingsForm } from './_components/SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await settingsService.getSettings(user!.id);

  return (
    <div className="p-5 pb-6 space-y-5">
      <div className="pt-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">
          Preferências
        </p>
        <h1 className="text-2xl font-bold text-slate-50">Configurações</h1>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
