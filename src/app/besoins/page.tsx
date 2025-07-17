'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import Modal from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { z } from 'zod';
import { StatutUrgence } from '@/lib/types';
import BesoinCreateForm from './BesoinCreateForm';
import BesoinEditForm from './BesoinEditForm';
import BesoinDeleteConfirmation from './BesoinDeleteConfirmation';

interface Besoin {
  id: number;
  chantier: { id: number; nom: string };
  fournisseur: { id: number; nom_fournisseur: string };
  prestation: string;
  montant_besoin: number;
  statut_urgence: StatutUrgence;
  commentaire?: string;
  paiements: { montant_regle: number }[];
  date_besoin: string;
}

interface Chantier { id: number; nom: string; }
interface Fournisseur { id: number; nom_fournisseur: string; }

const STATUT_URGENCE_OPTIONS = [
  { value: StatutUrgence.NORMAL, label: 'Normal' },
  { value: StatutUrgence.URGENT, label: 'Urgent' },
];

// Zod schema for besoin form
const besoinSchema = z.object({
  chantierId: z.string().min(1, 'Chantier requis'),
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  prestation: z.string().min(1, 'Prestation requise'),
  montant_besoin: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Montant doit être un nombre positif',
  }),
  statut_urgence: z.nativeEnum(StatutUrgence),
  commentaire: z.string().optional(),
  date_besoin: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date invalide',
  }),
});

const BesoinsPage: React.FC = () => {
  const [besoins, setBesoins] = useState<Besoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [editBesoin, setEditBesoin] = useState<Besoin | null>(null);
  const [deleteBesoin, setDeleteBesoin] = useState<Besoin | null>(null);
  const [form, setForm] = useState({
    chantierId: '',
    fournisseurId: '',
    prestation: '',
    montant_besoin: '',
    statut_urgence: StatutUrgence.NORMAL,
    commentaire: '',
    date_besoin: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter state
  const [filterMois, setFilterMois] = useState('');
  const [filterChantier, setFilterChantier] = useState('');
  const [filterFournisseur, setFilterFournisseur] = useState('');
  const [filterUrgence, setFilterUrgence] = useState('');
  // Month options
  const moisOptions = Array.from(new Set(besoins.map(b => b.date_besoin?.slice(0, 7)))).filter(Boolean).sort().reverse();

  // Filtered besoins
  const filteredBesoins = besoins.filter(b => {
    const mois = b.date_besoin?.slice(0, 7);
    return (
      (!filterMois || mois === filterMois) &&
      (!filterChantier || b.chantier.id.toString() === filterChantier) &&
      (!filterFournisseur || b.fournisseur.id.toString() === filterFournisseur) &&
      (!filterUrgence || b.statut_urgence === filterUrgence)
    );
  });
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredBesoins.length / rowsPerPage);
  const paginatedBesoins = filteredBesoins.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  useEffect(() => { setPage(1); }, [filterMois, filterChantier, filterFournisseur, filterUrgence]);

  useEffect(() => {
    fetchBesoins();
    fetchChantiers();
    fetchFournisseurs();
  }, []);

  async function fetchBesoins() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Besoin[]>('/api/besoins');
      setBesoins(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function fetchChantiers() {
    try {
      const data = await apiGet<Chantier[]>('/api/chantiers');
      setChantiers(data);
    } catch {}
  }
  async function fetchFournisseurs() {
    try {
      const data = await apiGet<Fournisseur[]>('/api/fournisseurs');
      setFournisseurs(data);
    } catch {}
  }

  function getSolde(b: Besoin) {
    const totalRegle = b.paiements.reduce((sum, p) => sum + p.montant_regle, 0);
    return b.montant_besoin - totalRegle;
  }

  function openCreateModal() {
    setEditBesoin(null);
    setForm({
      chantierId: '',
      fournisseurId: '',
      prestation: '',
      montant_besoin: '',
      statut_urgence: StatutUrgence.NORMAL,
      commentaire: '',
      date_besoin: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
  }
  function openEditModal(b: Besoin) {
    setEditBesoin(b);
    setForm({
      chantierId: b.chantier.id.toString(),
      fournisseurId: b.fournisseur.id.toString(),
      prestation: b.prestation,
      montant_besoin: b.montant_besoin.toString(),
      statut_urgence: b.statut_urgence,
      commentaire: b.commentaire || '',
      date_besoin: b.date_besoin ? b.date_besoin.slice(0, 10) : '',
    });
    setFormError(null);
  }
  function closeModal() {
    setEditBesoin(null);
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
    const result = besoinSchema.safeParse(form);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message || 'Erreur de validation.');
      setSaving(false);
      return;
    }
    const payload = {
      chantierId: Number(form.chantierId),
      fournisseurId: Number(form.fournisseurId),
      prestation: form.prestation,
      montant_besoin: parseFloat(form.montant_besoin),
      statut_urgence: form.statut_urgence as StatutUrgence,
      commentaire: form.commentaire || undefined,
      date_besoin: new Date(form.date_besoin),
    };
    try {
      if (editBesoin) {
        await apiPut(`/api/besoins/${editBesoin.id}`, payload);
      } else {
        await apiPost('/api/besoins', payload);
      }
      closeModal();
      fetchBesoins();
    } catch (e: any) {
      setFormError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }
  function openDeleteModal(b: Besoin) {
    setDeleteBesoin(b);
  }
  function closeDeleteModal() {
    setDeleteBesoin(null);
  }
  async function handleDelete() {
    if (!deleteBesoin) return;
    setSaving(true);
    try {
      await apiDelete(`/api/besoins/${deleteBesoin.id}`);
      closeDeleteModal();
      fetchBesoins();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  }

  // Add total calculation
  const totalBesoins = besoins.reduce((sum, b) => sum + b.montant_besoin, 0);

  return (
    <div className="p-6 space-y-8">
      {/* Total des besoins affichés */}
      <div className="mb-4">
        <span className="text-lg font-semibold">Total des besoins affichés : </span>
        <span className="text-2xl font-bold text-blue-600">
          {totalBesoins.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
        </span>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Besoins</h1>
        <Button onClick={() => setModalOpen(true)}>Créer un besoin</Button>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Créer un besoin"
          description="Remplissez le formulaire pour créer un besoin."
        >
          <BesoinCreateForm
            form={form}
            setForm={setForm}
            formError={formError}
            setFormError={setFormError}
            saving={saving}
            handleSubmit={handleSubmit}
            closeModal={closeModal}
            chantiers={chantiers}
            fournisseurs={fournisseurs}
          />
        </Modal>
      </div>
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
              {chantiers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
          <label className="block text-sm font-medium mb-1">Fournisseur</label>
          <Select value={filterFournisseur} onValueChange={setFilterFournisseur}>
            <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
              <SelectItem value="all">Tous</SelectItem>
              {fournisseurs.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.nom_fournisseur}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
          <label className="block text-sm font-medium mb-1">Urgence</label>
          <Select value={filterUrgence} onValueChange={setFilterUrgence}>
            <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value={StatutUrgence.URGENT}>Urgent</SelectItem>
              <SelectItem value={StatutUrgence.NORMAL}>Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <Card>
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Chantier</th>
              <th className="px-4 py-2 text-left">Fournisseur</th>
              <th className="px-4 py-2 text-left">Prestation</th>
              <th className="px-4 py-2 text-right">Montant</th>
              <th className="px-4 py-2 text-left">Urgence</th>
              <th className="px-4 py-2 text-left">Commentaire</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Solde</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-4">Chargement...</td></tr>
            ) : paginatedBesoins.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-4">Aucun besoin</td></tr>
            ) : paginatedBesoins.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="px-4 py-2">{b.chantier?.nom}</td>
                <td className="px-4 py-2">{b.fournisseur?.nom_fournisseur}</td>
                <td className="px-4 py-2">{b.prestation}</td>
                <td className="px-4 py-2 text-right">{b.montant_besoin.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</td>
                <td className="px-4 py-2 text-center">{b.statut_urgence}</td>
                <td className="px-4 py-2">{b.commentaire || '-'}</td>
                <td className="px-4 py-2">{b.date_besoin ? b.date_besoin.slice(0, 10) : '-'}</td>
                <td className="px-4 py-2 text-right">{getSolde(b).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Modal
                    open={editBesoin?.id === b.id}
                    onOpenChange={open => setEditBesoin(open ? b : null)}
                    title="Modifier le besoin"
                    description="Modifiez les informations du besoin sélectionné."
                  >
                    <BesoinEditForm
                      form={form}
                      setForm={setForm}
                      formError={formError}
                      setFormError={setFormError}
                      saving={saving}
                      handleSubmit={handleSubmit}
                      closeModal={closeModal}
                      chantiers={chantiers}
                      fournisseurs={fournisseurs}
                    />
                  </Modal>
                  <Modal
                    open={deleteBesoin?.id === b.id}
                    onOpenChange={open => setDeleteBesoin(open ? b : null)}
                    title="Supprimer le besoin"
                    description="Confirmez la suppression de ce besoin."
                  >
                    <BesoinDeleteConfirmation
                      deleteBesoin={deleteBesoin}
                      closeDeleteModal={closeDeleteModal}
                      saving={saving}
                      handleDelete={handleDelete}
                    />
                  </Modal>
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
    </div>
  );
};

export default BesoinsPage; 