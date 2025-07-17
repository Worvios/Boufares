'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import Modal from '@/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Chantier {
  id: number;
  nom: string;
  responsable: string;
  location: string;
}

const ChantiersPage: React.FC = () => {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', responsable: '', location: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', responsable: '', location: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // TODO: Add modal state for create/edit

  useEffect(() => {
    fetchChantiers();
  }, []);

  async function fetchChantiers() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Chantier[]>('/api/chantiers');
      setChantiers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // TODO: Implement create, update, delete handlers

  async function handleCreate() {
    setSubmitting(true);
    setFormError(null);
    try {
      if (!form.nom || !form.responsable || !form.location) {
        setFormError('Tous les champs sont obligatoires.');
        setSubmitting(false);
        return;
      }
      await apiPost<Chantier>('/api/chantiers', form);
      setOpen(false);
      setForm({ nom: '', responsable: '', location: '' });
      fetchChantiers();
    } catch (e: any) {
      setFormError(e.message || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id: number) {
    const chantier = chantiers.find((c) => c.id === id);
    if (!chantier) return;
    setEditForm({ nom: chantier.nom, responsable: chantier.responsable, location: chantier.location });
    setEditId(id);
    setEditError(null);
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setSubmitting(true);
    try {
      if (!editForm.nom || !editForm.responsable || !editForm.location) {
        setEditError('Tous les champs sont obligatoires.');
      }
      await apiPut<Chantier>(`/api/chantiers/${editId}`, editForm);
      setEditOpen(false);
      setEditId(null);
      fetchChantiers();
    } catch (e: any) {
      setEditError(e.message || 'Erreur lors de la modification.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete(`/api/chantiers/${deleteId}`);
      setDeleteId(null);
      fetchChantiers();
    } catch (e: any) {
      setDeleteError(e.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chantiers</h1>
        <Button onClick={() => setOpen(true)}>Créer un chantier</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Créer un chantier"
          description="Remplissez le formulaire pour créer un chantier."
        >
          <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Nom</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Responsable</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Localisation</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
            </div>
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer'}</Button>
            </div>
          </form>
        </Modal>
      </div>
      {error && <Alert message={error} className="mb-4" />}
      <Card>
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Responsable</th>
              <th className="px-4 py-2 text-left">Localisation</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8"><Spinner className="mx-auto" /><div className="mt-2 text-gray-500">Chargement des chantiers...</div></td></tr>
            ) : chantiers.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8"><Building2 className="mx-auto mb-2 text-gray-300" size={36} /><div className="text-gray-500">Aucun chantier trouvé.<br/>Ajoutez-en un pour commencer.</div></td></tr>
            ) : chantiers.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="px-4 py-2">{c.nom}</td>
                <td className="px-4 py-2">{c.responsable}</td>
                <td className="px-4 py-2">{c.location}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Button variant="outline" onClick={() => handleEdit(c.id)}>Modifier</Button>
                  <Button variant="destructive" onClick={() => handleDelete(c.id)}>Supprimer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Modal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Modifier le chantier"
        description="Modifiez les informations du chantier sélectionné."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Nom</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Responsable</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={editForm.responsable} onChange={e => setEditForm(f => ({ ...f, responsable: e.target.value }))} required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Localisation</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          {editError && <div className="text-red-600 text-sm">{editError}</div>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Modification...' : 'Modifier'}</Button>
          </div>
        </form>
      </Modal>
      {deleteId !== null && (
        <Modal
          open={true}
          onOpenChange={() => setDeleteId(null)}
          title="Supprimer le chantier"
          description="Confirmez la suppression de ce chantier."
        >
          {deleteError && <div className="text-red-600 text-sm mt-2">{deleteError}</div>}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Suppression...' : 'Supprimer'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ChantiersPage; 