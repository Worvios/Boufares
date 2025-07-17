'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import Modal from '@/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Fournisseur {
  id: number;
  nom_fournisseur: string;
  type: string;
}

const FournisseursPage: React.FC = () => {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom_fournisseur: '', type: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nom_fournisseur: '', type: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // TODO: Add modal state for create/edit

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  async function fetchFournisseurs() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Fournisseur[]>('/api/fournisseurs');
      setFournisseurs(data);
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
      if (!form.nom_fournisseur || !form.type) {
        setFormError('Tous les champs sont obligatoires.');
        setSubmitting(false);
        return;
      }
      await apiPost<Fournisseur>('/api/fournisseurs', form);
      setOpen(false);
      setForm({ nom_fournisseur: '', type: '' });
      fetchFournisseurs();
    } catch (e: any) {
      setFormError(e.message || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id: number) {
    const fournisseur = fournisseurs.find((f) => f.id === id);
    if (!fournisseur) return;
    setEditForm({ nom_fournisseur: fournisseur.nom_fournisseur, type: fournisseur.type });
    setEditId(id);
    setEditError(null);
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setSubmitting(true);
    try {
      if (!editForm.nom_fournisseur || !editForm.type) {
        setEditError('Tous les champs sont obligatoires.');
        setSubmitting(false);
        return;
      }
      await apiPut<Fournisseur>(`/api/fournisseurs/${editId}`, editForm);
      setEditOpen(false);
      setEditId(null);
      fetchFournisseurs();
    } catch (e: any) {
      setEditError(e.message || 'Erreur lors de la modification.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete(`/api/fournisseurs/${deleteId}`);
      setDeleteId(null);
      fetchFournisseurs();
    } catch (e: any) {
      setDeleteError(e.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fournisseurs</h1>
        <Button onClick={() => setOpen(true)}>Créer un fournisseur</Button>
        <Modal open={open} onOpenChange={setOpen}>
          <Modal.Header>
            <Modal.Title>Créer un fournisseur</Modal.Title>
            <Modal.Description>Remplissez le formulaire pour créer un fournisseur.</Modal.Description>
          </Modal.Header>
          <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="space-y-4 p-6">
            {formError && <div className="text-red-600 mb-2">{formError}</div>}
            <div>
              <label className="block mb-1">Nom *</label>
              <input type="text" className="w-full border rounded px-2 py-1" value={form.nom_fournisseur} onChange={e => setForm(f => ({ ...f, nom_fournisseur: e.target.value }))} required />
            </div>
            <div>
              <label className="block mb-1">Type *</label>
              <input type="text" className="w-full border rounded px-2 py-1" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
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
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8"><Spinner className="mx-auto" /><div className="mt-2 text-gray-500">Chargement des fournisseurs...</div></td></tr>
            ) : fournisseurs.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8"><Building2 className="mx-auto mb-2 text-gray-300" size={36} /><div className="text-gray-500">Aucun fournisseur trouvé.<br/>Ajoutez-en un pour commencer.</div></td></tr>
            ) : fournisseurs.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="px-4 py-2">{f.nom_fournisseur}</td>
                <td className="px-4 py-2">{f.type}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Modal open={editOpen} onOpenChange={setEditOpen}>
                    <Modal.Header>
                      <Modal.Title>Modifier le fournisseur</Modal.Title>
                      <Modal.Description>Modifiez les informations du fournisseur sélectionné.</Modal.Description>
                    </Modal.Header>
                    <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
                      {editError && <div className="text-red-600 mb-2">{editError}</div>}
                      <div>
                        <label className="block mb-1">Nom *</label>
                        <input type="text" className="w-full border rounded px-2 py-1" value={editForm.nom_fournisseur} onChange={e => setEditForm(f => ({ ...f, nom_fournisseur: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="block mb-1">Type *</label>
                        <input type="text" className="w-full border rounded px-2 py-1" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} required />
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Annuler</Button>
                        <Button type="submit" disabled={submitting}>{submitting ? 'Modification...' : 'Modifier'}</Button>
                      </div>
                    </form>
                  </Modal>
                  <Modal open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                    <Modal.Header>
                      <Modal.Title>Supprimer le fournisseur</Modal.Title>
                      <Modal.Description>Confirmez la suppression de ce fournisseur.</Modal.Description>
                    </Modal.Header>
                    <div className="p-6">
                      {deleteError && <div className="text-red-600 text-sm mt-2">{deleteError}</div>}
                      <div className="flex justify-end space-x-2 mt-6">
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Annuler</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Suppression...' : 'Supprimer'}</Button>
                      </div>
                    </div>
                  </Modal>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default FournisseursPage; 