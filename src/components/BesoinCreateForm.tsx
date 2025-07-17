import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost } from '@/lib/api';

interface BesoinCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Chantier { id: number; nom: string; }
interface Fournisseur { id: number; nom_fournisseur: string; }

const BesoinCreateForm: React.FC<BesoinCreateFormProps> = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    chantierId: '',
    fournisseurId: '',
    prestation: '',
    montant_besoin: '',
    statut_urgence: 'NORMAL',
    commentaire: '',
    date_besoin: new Date().toISOString().slice(0, 10),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

  useEffect(() => {
    apiGet<Chantier[]>('/api/chantiers').then(setChantiers);
    apiGet<Fournisseur[]>('/api/fournisseurs').then(setFournisseurs);
  }, []);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    if (!form.chantierId || !form.fournisseurId || !form.prestation || !form.montant_besoin || !form.date_besoin) {
      setFormError('Tous les champs obligatoires doivent être remplis.');
      setSaving(false);
      return;
    }
    const payload = {
      chantierId: Number(form.chantierId),
      fournisseurId: Number(form.fournisseurId),
      prestation: form.prestation,
      montant_besoin: parseFloat(form.montant_besoin),
      statut_urgence: form.statut_urgence as 'URGENT' | 'NORMAL',
      commentaire: form.commentaire || undefined,
      date_besoin: new Date(form.date_besoin),
    };
    try {
      await apiPost('/api/besoins', payload);
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
        <label className="block mb-1">Chantier *</label>
        <select name="chantierId" value={form.chantierId} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
          <option value="">Sélectionner...</option>
          {chantiers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1">Fournisseur *</label>
        <select name="fournisseurId" value={form.fournisseurId} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
          <option value="">Sélectionner...</option>
          {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom_fournisseur}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1">Prestation *</label>
        <input name="prestation" value={form.prestation} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block mb-1">Montant (MAD) *</label>
        <input name="montant_besoin" type="number" min="0" step="0.01" value={form.montant_besoin} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block mb-1">Urgence *</label>
        <select name="statut_urgence" value={form.statut_urgence} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
          <option value="NORMAL">Normal</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      <div>
        <label className="block mb-1">Date du besoin *</label>
        <input name="date_besoin" type="date" value={form.date_besoin} onChange={handleFormChange} className="w-full border rounded px-2 py-1" required />
      </div>
      <div>
        <label className="block mb-1">Commentaire</label>
        <input name="commentaire" value={form.commentaire} onChange={handleFormChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>}
        <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </form>
  );
};

export default BesoinCreateForm; 