'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiGet } from '@/lib/api';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { AlertTriangle, PlusCircle, CreditCard, Building2 } from 'lucide-react';
import BesoinCreateForm from '@/components/BesoinCreateForm';
import PaiementCreateForm from '@/components/PaiementCreateForm';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

interface RecentPaiement {
  id: number;
  date_paiement: string;
  montant_regle: number;
  besoin: {
    prestation: string;
    chantier: { nom: string };
    fournisseur: { nom_fournisseur: string };
  };
}
interface RecentChantier {
  id: number;
  nom: string;
  responsable: string;
  createdAt?: string;
}
interface ChantierDetails {
  id: number;
  nom: string;
  responsable: string;
  location?: string;
  besoins?: any[];
}
interface DashboardData {
  chantiersCount: number;
  fournisseursCount: number;
  besoinsCount: number;
  paiementsCount: number;
  totalBesoins: number;
  totalPayes: number;
  totalSoldes: number;
  topUrgentBesoins: Array<{
    id: number;
    chantier: string;
    fournisseur: string;
    prestation: string;
    montant_besoin: number;
    montant_regle: number;
    solde: number;
    statut_urgence: 'URGENT' | 'NORMAL';
    date_besoin: string;
    commentaire?: string;
  }>;
  recentPaiements: RecentPaiement[];
  recentChantiers: RecentChantier[];
  chartData?: {
    besoinsParChantier: { [key: string]: number };
    paiementsParType: { [key: string]: number };
    paiementsParMois: { [key: string]: number };
  };
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [mois, setMois] = useState<string>('');
  const [chantierId, setChantierId] = useState<string>('');
  const [fournisseurId, setFournisseurId] = useState<string>('');
  const [urgence, setUrgence] = useState<string>('');
  // Options
  const [chantiers, setChantiers] = useState<{ id: number; nom: string }[]>([]);
  const [fournisseurs, setFournisseurs] = useState<{ id: number; nom_fournisseur: string }[]>([]);
  const [moisOptions, setMoisOptions] = useState<string[]>([]);
  const [showCharts, setShowCharts] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const router = useRouter();
  const [openBesoinModal, setOpenBesoinModal] = useState(false);
  const [openPaiementModal, setOpenPaiementModal] = useState(false);
  const [openUrgentModal, setOpenUrgentModal] = useState(false);
  const [selectedChantierId, setSelectedChantierId] = useState<number | null>(null);
  const [chantierDetails, setChantierDetails] = useState<ChantierDetails | null>(null);
  const [chantierDetailsLoading, setChantierDetailsLoading] = useState(false);
  const [chantierDetailsModalOpen, setChantierDetailsModalOpen] = useState(false);
  const [paiementBesoinId, setPaiementBesoinId] = useState<number | null>(null);

  // Fetch options on mount
  useEffect(() => {
    apiGet<{ id: number; nom: string }[]>('/api/chantiers').then(setChantiers);
    apiGet<{ id: number; nom_fournisseur: string }[]>('/api/fournisseurs').then(setFournisseurs);
    // Fetch all besoins to extract unique months
    apiGet<any[]>('/api/besoins').then(besoins => {
      const moisSet = new Set<string>();
      besoins.forEach(b => {
        if (b.date_besoin) {
          const d = new Date(b.date_besoin);
          const m = d.toISOString().slice(0, 7); // YYYY-MM
          moisSet.add(m);
        }
      });
      setMoisOptions(Array.from(moisSet).sort().reverse());
    });
  }, []);

  // Fetch dashboard data with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (mois && mois !== 'all') params.set('mois', mois);
    if (chantierId && chantierId !== 'all') params.set('chantierId', chantierId);
    if (fournisseurId && fournisseurId !== 'all') params.set('fournisseurId', fournisseurId);
    if (urgence && urgence !== 'all') params.set('urgence', urgence);
    fetchDashboard(params.toString());
  }, [mois, chantierId, fournisseurId, urgence]);

  // Fetch chantier details when selectedChantierId changes
  useEffect(() => {
    if (selectedChantierId) {
      setChantierDetailsLoading(true);
      fetch(`/api/chantiers/${selectedChantierId}`)
        .then(res => res.json())
        .then(data => setChantierDetails(data))
        .finally(() => setChantierDetailsLoading(false));
    } else {
      setChantierDetails(null);
    }
  }, [selectedChantierId]);

  async function fetchDashboard(query = '') {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/dashboard?${query}` : '/api/dashboard';
      const d = await apiGet<DashboardData>(url);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper: count unpaid urgent besoins
  const unpaidUrgentCount = data?.topUrgentBesoins?.filter(b => b.solde > 0).length || 0;
  // Helper: combine recent activity
  const recentActivity = [
    ...(data?.recentPaiements?.map((p) => ({
      type: 'paiement',
      date: p.date_paiement,
      label: `Paiement de ${p.montant_regle.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })} pour ${p.besoin?.prestation}`,
      sub: `${p.besoin?.chantier?.nom} — ${p.besoin?.fournisseur?.nom_fournisseur}`
    })) || []),
    ...(data?.recentChantiers?.map((c) => ({
      type: 'chantier',
      date: c.createdAt || c.id, // fallback to id if no createdAt
      label: `Nouveau chantier : ${c.nom}`,
      sub: `Responsable : ${c.responsable}`
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Helper: get chantierId from chantier name
  function getChantierIdByName(name: string): number | null {
    const chantier = chantiers.find(c => c.nom === name);
    return chantier ? chantier.id : null;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Key Stats & Urgent Alert */}
      <div className="space-y-4">
        {unpaidUrgentCount > 0 && (
          <div className="flex items-center gap-3 bg-red-100 border border-red-300 text-red-800 rounded-lg px-4 py-2">
            <AlertTriangle className="text-red-600" />
            <span><b>{unpaidUrgentCount}</b> besoin(s) urgent(s) non réglé(s) !</span>
            <Button variant="destructive" size="sm" className="ml-auto" onClick={() => setOpenUrgentModal(true)}>Voir</Button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Total besoins</CardTitle></CardHeader>
            <CardContent><span className="text-2xl font-bold text-blue-600">{data ? data.totalBesoins.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' }) : '...'}</span></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total payés</CardTitle></CardHeader>
            <CardContent><span className="text-2xl font-bold text-green-600">{data ? data.totalPayes.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' }) : '...'}</span></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Soldes restants</CardTitle></CardHeader>
            <CardContent><span className="text-2xl font-bold text-red-600">{data ? data.totalSoldes.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' }) : '...'}</span></CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-2">
        <Button variant="default" size="sm" onClick={() => setOpenBesoinModal(true)}><PlusCircle className="mr-2" />Ajouter un besoin</Button>
        <Button variant="default" size="sm" onClick={() => setOpenPaiementModal(true)}><CreditCard className="mr-2" />Ajouter un paiement</Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/chantiers')}><Building2 className="mr-2" />Voir tous les chantiers</Button>
      </div>

      {/* Filters (sticky/collapsible) */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur rounded-lg shadow-sm mb-4 p-4">
        <div className="flex items-center mb-2">
          <span className="font-semibold text-lg mr-2">Filtres</span>
          <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(v => !v)}>{filtersOpen ? 'Masquer' : 'Afficher'}</Button>
        </div>
        {filtersOpen && (
          <div className="flex flex-wrap gap-4">
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
              <label className="block text-sm font-medium mb-1">Mois</label>
              <Select value={mois} onValueChange={setMois}>
                <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
                  <SelectValue placeholder="Tous les mois" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
                  <SelectItem value="all">Tous les mois</SelectItem>
                  {moisOptions.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
              <label className="block text-sm font-medium mb-1">Chantier</label>
              <Select value={chantierId} onValueChange={setChantierId}>
                <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
                  <SelectValue placeholder="Tous les chantiers" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
                  <SelectItem value="all">Tous les chantiers</SelectItem>
                  {chantiers.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
              <label className="block text-sm font-medium mb-1">Fournisseur</label>
              <Select value={fournisseurId} onValueChange={setFournisseurId}>
                <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
                  <SelectValue placeholder="Tous les fournisseurs" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {fournisseurs.map(f => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.nom_fournisseur}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1 border border-blue-100">
              <label className="block text-sm font-medium mb-1">Urgence</label>
              <Select value={urgence} onValueChange={setUrgence}>
                <SelectTrigger className="w-full bg-white rounded-lg shadow-md border border-blue-100 px-4 py-2 text-base text-blue-900 focus:ring-2 focus:ring-blue-400 transition-all duration-200" >
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-lg shadow-lg border border-blue-100 p-1 text-blue-900 z-50" >
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Section: Graphiques */}
      <div className="flex items-center mb-2"><span className="font-semibold text-lg">Graphiques</span></div>
      {/* Toggle Charts Button */}
      <div className="mb-4">
        <Button variant="outline" onClick={() => setShowCharts((v) => !v)}>
          {showCharts ? 'Masquer les graphiques' : 'Afficher les graphiques'}
        </Button>
      </div>

      {/* Dashboard Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des besoins par chantier</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.chartData && Object.keys(data.chartData.besoinsParChantier).length > 0 ? (
                <div style={{ height: 200 }}>
                  <Pie
                    data={{
                      labels: Object.keys(data.chartData.besoinsParChantier),
                      datasets: [
                        {
                          data: Object.values(data.chartData.besoinsParChantier),
                          backgroundColor: [
                            '#2563eb', '#22c55e', '#f59e42', '#ef4444', '#a855f7', '#14b8a6', '#eab308', '#6366f1', '#f43f5e', '#0ea5e9',
                          ],
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: true, position: 'bottom' } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">Aucune donnée</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Répartition des paiements par type</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.chartData && Object.keys(data.chartData.paiementsParType).length > 0 ? (
                <div style={{ height: 200 }}>
                  <Pie
                    data={{
                      labels: Object.keys(data.chartData.paiementsParType),
                      datasets: [
                        {
                          data: Object.values(data.chartData.paiementsParType),
                          backgroundColor: [
                            '#22c55e', '#2563eb', '#f59e42', '#ef4444', '#a855f7', '#14b8a6', '#eab308', '#6366f1', '#f43f5e', '#0ea5e9',
                          ],
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: true, position: 'bottom' } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">Aucune donnée</span>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Évolution des paiements par mois</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.chartData && Object.keys(data.chartData.paiementsParMois).length > 0 ? (
                <div style={{ height: 250 }}>
                  <Bar
                    data={{
                      labels: Object.keys(data.chartData.paiementsParMois),
                      datasets: [
                        {
                          label: 'Montant payé (MAD)',
                          data: Object.values(data.chartData.paiementsParMois),
                          backgroundColor: '#2563eb',
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: { x: { title: { display: true, text: 'Mois' } }, y: { title: { display: true, text: 'MAD' } } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">Aucune donnée</span>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section: Activité Récente */}
      <div className="flex items-center mb-2"><span className="font-semibold text-lg">Activité Récente</span></div>
      <Card className="mb-6">
        <CardContent>
          {recentActivity.length > 0 ? (
            <ul className="divide-y">
              {recentActivity.map((a, i) => (
                <li key={i} className="py-2 flex flex-col">
                  <span className="font-semibold">{a.label}</span>
                  <span className="text-sm text-muted-foreground">{a.sub}</span>
                  <span className="text-xs text-gray-500">{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">Aucune activité récente</span>
          )}
        </CardContent>
      </Card>

      {/* Section: Nombre d'entités */}
      <div className="flex items-center mb-2"><span className="font-semibold text-lg">Entités</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader><CardTitle>Chantiers</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{data ? data.chantiersCount : '...'}</span></CardContent></Card>
        <Card><CardHeader><CardTitle>Fournisseurs</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{data ? data.fournisseursCount : '...'}</span></CardContent></Card>
        <Card><CardHeader><CardTitle>Besoins</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{data ? data.besoinsCount : '...'}</span></CardContent></Card>
        <Card><CardHeader><CardTitle>Paiements</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{data ? data.paiementsCount : '...'}</span></CardContent></Card>
      </div>

      {/* Section: Top 5 besoins urgents */}
      <div className="flex items-center mb-2"><span className="font-semibold text-lg">Top 5 besoins urgents</span></div>
      <div>
        {loading ? (
          <div>Chargement...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Chantier</th>
                  <th className="px-4 py-2 text-left">Fournisseur</th>
                  <th className="px-4 py-2 text-left">Prestation</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                  <th className="px-4 py-2 text-right">Payé</th>
                  <th className="px-4 py-2 text-right">Solde</th>
                  <th className="px-4 py-2 text-center">Date</th>
                  <th className="px-4 py-2 text-center">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {data && data.topUrgentBesoins.length > 0 ? data.topUrgentBesoins.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="px-4 py-2">{b.chantier}</td>
                    <td className="px-4 py-2">{b.fournisseur}</td>
                    <td className="px-4 py-2">{b.prestation}</td>
                    <td className="px-4 py-2 text-right">{b.montant_besoin.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</td>
                    <td className="px-4 py-2 text-right">{b.montant_regle.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</td>
                    <td className="px-4 py-2 text-right">{b.solde.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</td>
                    <td className="px-4 py-2 text-center">{b.date_besoin ? new Date(b.date_besoin).toLocaleDateString('fr-FR') : ''}</td>
                    <td className="px-4 py-2 text-center">{b.commentaire || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="text-center py-4">Aucun besoin urgent</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals for creation */}
      <Modal
        open={openBesoinModal}
        onOpenChange={setOpenBesoinModal}
        title="Créer un besoin"
        description="Remplissez le formulaire pour créer un besoin."
      >
        <BesoinCreateForm onSuccess={() => { setOpenBesoinModal(false); fetchDashboard(); }} onCancel={() => setOpenBesoinModal(false)} />
      </Modal>
      <Modal
        open={openPaiementModal}
        onOpenChange={(open) => { setOpenPaiementModal(open); if (!open) setPaiementBesoinId(null); }}
        title="Créer un paiement"
        description="Remplissez le formulaire pour créer un paiement."
      >
        <PaiementCreateForm besoinId={paiementBesoinId} onSuccess={() => { setOpenPaiementModal(false); setPaiementBesoinId(null); fetchDashboard(); }} onCancel={() => { setOpenPaiementModal(false); setPaiementBesoinId(null); }} />
      </Modal>
      {/* Modal for urgent besoins */}
      <Modal
        open={openUrgentModal}
        onOpenChange={setOpenUrgentModal}
        title="Besoins urgents non réglés"
        description="Liste des besoins urgents avec solde positif."
      >
        {data && data.topUrgentBesoins && data.topUrgentBesoins.filter(b => b.solde > 0).length > 0 ? (
          <div className="space-y-4 mt-4">
            {/* Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-1">
              <span className="font-semibold text-red-700">Total urgent : {data.topUrgentBesoins.filter(b => b.solde > 0).reduce((sum, b) => sum + b.montant_besoin, 0).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</span>
              <span className="font-semibold text-red-700">Total solde restant : {data.topUrgentBesoins.filter(b => b.solde > 0).reduce((sum, b) => sum + b.solde, 0).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</span>
            </div>
            {/* List */}
            <div className="flex flex-col gap-3">
              {data.topUrgentBesoins.filter(b => b.solde > 0).map((b) => (
                <div key={b.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-2 bg-white shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-red-800">{b.prestation}</div>
                    <div className="text-sm text-muted-foreground">{b.chantier} — {b.fournisseur}</div>
                    <div className="text-xs text-gray-500">Date : {b.date_besoin ? new Date(b.date_besoin).toLocaleDateString('fr-FR') : ''}</div>
                    {b.commentaire && <div className="text-xs text-gray-500">{b.commentaire}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[120px]">
                    <span className="text-sm">Montant : <b>{b.montant_besoin.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</b></span>
                    <span className="text-sm">Payé : <b className="text-green-700">{b.montant_regle.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</b></span>
                    <span className="text-sm">Solde : <b className="text-red-700">{b.solde.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</b></span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-[90px]">
                    <Button size="sm" variant="default" onClick={() => { setPaiementBesoinId(b.id); setOpenPaiementModal(true); }}>Régler</Button>
                    <Button size="sm" variant="outline" onClick={() => { const id = getChantierIdByName(b.chantier); if (id) { setSelectedChantierId(id); setChantierDetailsModalOpen(true); } }}>Voir</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground block mt-4">Aucun besoin urgent non réglé</span>
        )}
      </Modal>
      {/* Modal for chantier details */}
      <Modal
        open={chantierDetailsModalOpen}
        onOpenChange={setChantierDetailsModalOpen}
        title="Détails du chantier"
        description="Informations détaillées sur le chantier sélectionné."
      >
        {chantierDetailsLoading ? (
          <div>Chargement...</div>
        ) : chantierDetails ? (
          <div className="space-y-4">
            <div className="font-semibold text-lg">{chantierDetails.nom}</div>
            <div className="text-sm text-muted-foreground">Responsable : {chantierDetails.responsable}</div>
            <div className="text-sm">Localisation : {chantierDetails.location}</div>
            <div className="mt-2">
              <div className="font-semibold mb-1">Besoins</div>
              <div className="flex flex-col gap-2">
                {chantierDetails.besoins && chantierDetails.besoins.length > 0 ? chantierDetails.besoins.map((besoin: any) => (
                  <div key={besoin.id} className="border rounded p-2 flex flex-col md:flex-row md:items-center gap-2 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{besoin.prestation}</div>
                      <div className="text-sm text-muted-foreground">Fournisseur : {besoin.fournisseur?.nom_fournisseur}</div>
                      <div className="text-xs text-gray-500">Date : {besoin.date_besoin ? new Date(besoin.date_besoin).toLocaleDateString('fr-FR') : ''}</div>
                      {besoin.commentaire && <div className="text-xs text-gray-500">{besoin.commentaire}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 min-w-[120px]">
                      <span className="text-sm">Montant : <b>{besoin.montant_besoin.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</b></span>
                      <span className="text-sm">Payé : <b className="text-green-700">{(besoin.paiements?.reduce((s: number, p: any) => s + p.montant_regle, 0) || 0).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</b></span>
                      <span className="text-sm">Solde : <b className="text-red-700">{(besoin.montant_besoin - (besoin.paiements?.reduce((s: number, p: any) => s + p.montant_regle, 0) || 0)).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</b></span>
                    </div>
                  </div>
                )) : <span className="text-muted-foreground">Aucun besoin</span>}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Chantier introuvable</span>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage; 