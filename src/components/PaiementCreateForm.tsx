import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost } from '@/lib/api';

interface PaiementCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  besoinId?: number | null;
}

interface BesoinOption {
  id: number;
  prestation: string;
  chantier: { nom: string };
}

const PaiementCreateForm: React.FC<PaiementCreateFormProps> = ({ onSuccess, onCancel, besoinId }) => {
  const [form, setForm] = useState({
    besoinId: '',
    montant_regle: '',
    mois_concerne: '',
    type_recette: 'VIREMENT',
    date_paiement: new Date().toISOString().slice(0, 10),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [besoins, setBesoins] = useState<BesoinOption[]>([]);

  useEffect(() => {
    apiGet<BesoinOption[]>('/api/besoins').then(setBesoins);
  }, []);

  useEffect(() => {
    if (besoinId) {
      setForm(f => ({ ...f, besoinId: besoinId.toString() }));
    }
  }, [besoinId]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    if (!form.besoinId || !form.montant_regle || !form.mois_concerne || !form.type_recette || !form.date_paiement) {
      setFormError('Tous les champs obligatoires doivent être remplis.');
      setSaving(false);
      return;
    }
    const payload = {
      besoinId: Number(form.besoinId),
      montant_regle: parseFloat(form.montant_regle),
      mois_concerne: form.mois_concerne,
      type_recette: form.type_recette,
      date_paiement: new Date(form.date_paiement),
    };
    try {
      await apiPost('/api/paiements', payload);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setFormError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      {formError && <div className="text-red-600 mb-2">{formError}</div>}
      <div>
        <label className="block mb-1">Besoin *</label>
        <select name="besoinId" value={form.besoinId} onChange={handleFormChange} className="w-full border rounded px-2 py-1" disabled={!!besoinId}>
          <option value="">Sélectionner...</option>
          {besoins.map((b) => <option key={b.id} value={b.id}>{b.prestation} ({b.chantier.nom})</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1">Montant payé (MAD) *</label>
        <input name="montant_regle" type="number" min="0" step="0.01" value={form.montant_regle} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block mb-1">Mois concerné *</label>
        <input name="mois_concerne" type="month" value={form.mois_concerne} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block mb-1">Type de recette *</label>
        <select name="type_recette" value={form.type_recette} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
          <option value="VIREMENT">Virement</option>
          <option value="CHEQUE">Chèque</option>
          <option value="ESPECES">Espèces</option>
        </select>
      </div>
      <div>
        <label className="block mb-1">Date de paiement *</label>
        <input name="date_paiement" type="date" value={form.date_paiement} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>}
        <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </form>
  );
};

export default PaiementCreateForm; 