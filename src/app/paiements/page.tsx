'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import Modal from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { z } from 'zod';
import { TypeRecette } from '@/lib/types';
import PaiementCreateForm from '@/components/PaiementCreateForm';

interface Paiement {
  id: number;
  besoin: { id: number; prestation: string; chantier: { nom: string } };
  montant_regle: number;
  mois_concerne: string;
  type_recette: TypeRecette;
  date_paiement: string;
}

interface BesoinOption {
  id: number;
  prestation: string;
  chantier: { nom: string };
}

const TYPE_RECETTE_OPTIONS = [
  { value: TypeRecette.VIREMENT, label: 'Virement' },
  { value: TypeRecette.CHEQUE, label: 'Chèque' },
  { value: TypeRecette.ESPECES, label: 'Espèces' },
];

// Zod schema for paiement form
const paiementSchema = z.object({
  besoinId: z.string().min(1, 'Besoin requis'),
  montant_regle: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Montant doit être un nombre positif',
  }),
  mois_concerne: z.string().min(1, 'Mois concerné requis'),
  type_recette: z.nativeEnum(TypeRecette),
  date_paiement: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date invalide',
  }),
});

const PaiementsPage: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPaiement, setEditPaiement] = useState<Paiement | null>(null);
  const [deletePaiement, setDeletePaiement] = useState<Paiement | null>(null);
  const [form, setForm] = useState({
    besoinId: '',
    montant_regle: '',
    mois_concerne: '',
    type_recette: TypeRecette.VIREMENT,
    date_paiement: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [besoins, setBesoins] = useState<BesoinOption[]>([]);

  // Filter state
  const [filterMois, setFilterMois] = useState('');
  const [filterChantier, setFilterChantier] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBesoin, setFilterBesoin] = useState('');
  // Month options
  const moisOptions = Array.from(new Set(paiements.map(p => p.mois_concerne))).filter(Boolean).sort().reverse();
  const chantierOptions = Array.from(new Set(paiements.map(p => p.besoin?.chantier?.nom))).filter(Boolean);
  const besoinOptions = Array.from(new Set(paiements.map(p => p.besoin?.prestation))).filter(Boolean);
  // Filtered paiements
  const filteredPaiements = paiements.filter(p => {
    return (
      (!filterMois || p.mois_concerne === filterMois) &&
      (!filterChantier || p.besoin?.chantier?.nom === filterChantier) &&
      (!filterType || p.type_recette === filterType) &&
      (!filterBesoin || p.besoin?.prestation === filterBesoin)
    );
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredPaiements.length / rowsPerPage);
  const paginatedPaiements = filteredPaiements.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  useEffect(() => { setPage(1); }, [filterMois, filterChantier, filterType, filterBesoin]);

  useEffect(() => {
    fetchPaiements();
    fetchBesoins();
  }, []);

  async function fetchPaiements() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Paiement[]>('/api/paiements');
      setPaiements(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function fetchBesoins() {
    try {
      const data = await apiGet<BesoinOption[]>('/api/besoins');
      setBesoins(data);
    } catch {}
  }

  function openCreateModal() {
    setEditPaiement(null);
    setForm({
      besoinId: '',
      montant_regle: '',
      mois_concerne: '',
      type_recette: TypeRecette.VIREMENT,
      date_paiement: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setModalOpen(true);
  }
  function openEditModal(p: Paiement) {
    setEditPaiement(p);
    setForm({
      besoinId: p.besoin.id.toString(),
      montant_regle: p.montant_regle.toString(),
      mois_concerne: p.mois_concerne,
      type_recette: p.type_recette,
      date_paiement: p.date_paiement ? p.date_paiement.slice(0, 10) : '',
    });
    setFormError(null);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditPaiement(null);
    setFormError(null);
  }
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    // Zod validation
    const result = paiementSchema.safeParse(form);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message || 'Erreur de validation.');
      setSaving(false);
      return;
    }
    const payload = {
      besoinId: Number(form.besoinId),
      montant_regle: parseFloat(form.montant_regle),
      mois_concerne: form.mois_concerne,
      type_recette: form.type_recette as TypeRecette,
      date_paiement: new Date(form.date_paiement),
    };
    try {
      if (editPaiement) {
        await apiPut(`/api/paiements/${editPaiement.id}`, payload);
      } else {
        await apiPost('/api/paiements', payload);
      }
      closeModal();
      fetchPaiements();
    } catch (e: any) {
      setFormError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }
  function openDeleteModal(p: Paiement) {
    setDeletePaiement(p);
  }
  function closeDeleteModal() {
    setDeletePaiement(null);
  }
  async function handleDelete() {
    if (!deletePaiement) return;
    setSaving(true);
    try {
      await apiDelete(`/api/paiements/${deletePaiement.id}`);
      closeDeleteModal();
      fetchPaiements();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Paiements</h1>
        <Button onClick={() => setModalOpen(true)}>Créer un paiement</Button>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Créer un paiement"
          description="Remplissez le formulaire pour créer un paiement."
        >
          <PaiementCreateForm
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        </Modal>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
          <label className="block text-sm font-medium mb-1">Mois</label>
          <Select value={filterMois} onValueChange={setFilterMois}>
            <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
              <SelectItem value="all">Tous</SelectItem>
              {moisOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
          <label className="block text-sm font-medium mb-1">Chantier</label>
          <Select value={filterChantier} onValueChange={setFilterChantier}>
            <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
              <SelectItem value="all">Tous</SelectItem>
              {chantierOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
          <label className="block text-sm font-medium mb-1">Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value={TypeRecette.VIREMENT}>Virement</SelectItem>
              <SelectItem value={TypeRecette.CHEQUE}>Chèque</SelectItem>
              <SelectItem value={TypeRecette.ESPECES}>Espèces</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
          <label className="block text-sm font-medium mb-1">Besoin</label>
          <Select value={filterBesoin} onValueChange={setFilterBesoin}>
            <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
              <SelectItem value="all">Tous</SelectItem>
              {besoinOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Besoin</th>
              <th className="px-4 py-2 text-right">Montant payé</th>
              <th className="px-4 py-2 text-left">Mois concerné</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-center">Date</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Chargement...</td></tr>
            ) : paginatedPaiements.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4">Aucun paiement</td></tr>
            ) : paginatedPaiements.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-2">{p.besoin?.prestation} ({p.besoin?.chantier?.nom})</td>
                <td className="px-4 py-2 text-right">{p.montant_regle.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</td>
                <td className="px-4 py-2">{p.mois_concerne}</td>
                <td className="px-4 py-2">{p.type_recette}</td>
                <td className="px-4 py-2 text-center">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : ''}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button variant="outline" onClick={() => openEditModal(p)}>Modifier</Button>
                  <Button variant="destructive" onClick={() => openDeleteModal(p)}>Supprimer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
          <span className="mx-2">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
        </div>
      )}
      {/* Delete confirmation dialog */}
      <Modal
        open={!!deletePaiement}
        onOpenChange={closeDeleteModal}
        title="Supprimer le paiement"
        description="Confirmez la suppression de ce paiement."
      >
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={closeDeleteModal} disabled={saving}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? 'Suppression...' : 'Supprimer'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PaiementsPage; 