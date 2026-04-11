import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonIcon from '@mui/icons-material/Person';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableChartIcon from '@mui/icons-material/TableChart';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import { apiClient, setAuthToken } from './api/client';
import { appTheme } from './theme';
import type { AuthResponse, AuthUser, Role } from './types';

interface Consorcio {
  id: string;
  nombre: string;
  direccion: string;
}

interface Unidad {
  id: string;
  numero: string;
  coeficiente: number;
  metrosCuadrados: number | null;
  consorcioId: string;
  propietarioId?: string | null;
}

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  consorcioId: string;
}

interface Expensa {
  id: string;
  periodo: string;
  total: number;
  consorcioId: string;
  unidadId: string | null;
  unidadNumero?: string;
  criterioProrrateo: 'coeficiente' | 'm2';
}

interface GenerarExpensaResponse {
  periodo: string;
  consorcioId: string;
  criterioProrrateo: 'coeficiente' | 'm2';
  totalGastos: number;
  cantidadUnidades: number;
  expensasGeneradas: ExpensaApiResponse[];
}

interface Pago {
  id: string;
  monto: number;
  fecha: string;
  estado: string;
  metodo: 'manual' | 'online';
  referencia: string | null;
  comprobanteUrl: string | null;
  observacion?: string | null;
  unidadId: string;
  unidadNumero?: string;
  unidad?: {
    numero: string;
  } | null;
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  consorcioId: string | null;
}

interface OwnerApiResponse extends ManagedUser {
  pendingUnidadId?: string;
}

interface UnidadApiResponse extends Omit<Unidad, 'coeficiente' | 'metrosCuadrados'> {
  coeficiente: number | string;
  metrosCuadrados: number | string | null;
}

interface GastoApiResponse extends Omit<Gasto, 'monto'> {
  monto: number | string;
}

interface ExpensaApiResponse extends Omit<Expensa, 'total' | 'unidadNumero'> {
  total: number | string;
  unidad?: {
    numero: string;
  } | null;
}

interface PagoApiResponse extends Omit<Pago, 'monto'> {
  monto: number | string;
}

interface ExpensaDetalleResponse {
  expensa: {
    id: string;
    periodo: string;
    unidadId: string | null;
    unidadNumero: string | null;
    total: number;
    criterioProrrateo: 'coeficiente' | 'm2';
  };
  resumen: {
    totalGastos: number;
    cantidadGastos: number;
    pdfUrl: string;
  };
  gastos: Array<{
    id: string;
    descripcion: string;
    monto: number;
    fecha: string;
  }>;
}

interface ReporteResumen {
  periodo: string;
  consorcioId: string;
  totalGastos: number;
  totalExpensas: number;
  totalPagos: number;
}

interface RecordatorioPendientesResponse {
  periodo: string;
  consorcioId: string;
  recordatoriosGenerados: number;
  canal: string;
  proveedor: string;
}

interface NotificacionHistorialItem {
  id: string;
  tipo: string;
  canal: string;
  proveedor: string;
  estado: string;
  destinatarioNombre: string | null;
  destinatarioEmail: string | null;
  destinatarioTelefono: string | null;
  periodo: string | null;
  mensaje: string;
  detalleEstado: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificacionesHistorialResponse {
  total: number;
  items: NotificacionHistorialItem[];
}

interface WhatsappHealthResponse {
  provider: string;
  mode?: 'demo' | 'production';
  status: string;
  ready: boolean;
  detail: string;
  account?: {
    phoneNumberId: string;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
  };
}

interface WhatsappTestResponse {
  ok: boolean;
  estado: string;
  detalle: string | null;
  proveedor: string;
  destinatarioTelefono: string | null;
  historialId: string;
  createdAt: string;
}

interface ConsorcioIntegracionResponse {
  consorcioId: string;
  source: 'consorcio' | 'global_demo';
  mode: 'demo' | 'production';
  active: boolean;
  mercadoPagoTestPayerEmail: string | null;
  whatsappProvider: string | null;
  whatsappMetaPhoneNumberId: string | null;
  hasMercadoPagoAccessToken: boolean;
  hasWhatsappMetaToken: boolean;
  maskedMercadoPagoAccessToken: string | null;
  maskedWhatsappMetaToken: string | null;
  updatedAt: string | null;
}

interface MercadoPagoPreferenceResponse {
  pagoId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string | null;
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrador general',
  manager: 'Administrador de consorcio',
  owner: 'Propietario',
};

const notificationTypeLabels: Record<string, string> = {
  expensa_generada: 'Expensa generada',
  pago_recibido: 'Pago recibido',
  pago_pendiente_recordatorio: 'Recordatorio de pago',
  pago_pendiente_revision_manager: 'Pago pendiente de revision',
};

const getNotificationTypeLabel = (item: NotificacionHistorialItem): string => {
  if (item.metadata?.source === 'manual_test') {
    return 'Prueba WhatsApp';
  }

  return notificationTypeLabels[item.tipo] ?? item.tipo;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value);

const toNumber = (value: number | string) => Number(value);

type ViewMode = 'unidades' | 'gastos' | 'expensas' | 'pagos' | 'propietario' | 'reportes' | 'configuracion' | 'data' | 'admin';
type DataTab = 'consorcios' | 'unidades' | 'gastos' | 'expensas' | 'pagos';
type MobileCardAction = {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
};

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [consorcioId, setConsorcioId] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('unidades');
  const [dataTab, setDataTab] = useState<DataTab>('consorcios');
  const [reportePeriodo, setReportePeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [reporteConsorcioId, setReporteConsorcioId] = useState('');
  const [reporteResumen, setReporteResumen] = useState<ReporteResumen | null>(null);
  const [reporteLoading, setReporteLoading] = useState(false);
  const [recordatorioLoading, setRecordatorioLoading] = useState(false);
  const [recordatorioResultado, setRecordatorioResultado] = useState<RecordatorioPendientesResponse | null>(null);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [notificacionesHistorial, setNotificacionesHistorial] = useState<NotificacionHistorialItem[]>([]);
  const [whatsappHealthLoading, setWhatsappHealthLoading] = useState(false);
  const [whatsappHealth, setWhatsappHealth] = useState<WhatsappHealthResponse | null>(null);
  const [whatsappTestPhone, setWhatsappTestPhone] = useState('');
  const [whatsappTestMessage, setWhatsappTestMessage] = useState('');
  const [whatsappTestLoading, setWhatsappTestLoading] = useState(false);
  const [whatsappTestResult, setWhatsappTestResult] = useState<WhatsappTestResponse | null>(null);
  const [integracionLoading, setIntegracionLoading] = useState(false);
  const [integracionSaving, setIntegracionSaving] = useState(false);
  const [integracionMeta, setIntegracionMeta] = useState<ConsorcioIntegracionResponse | null>(null);
  const [integracionForm, setIntegracionForm] = useState({
    mode: 'demo' as 'demo' | 'production',
    active: true,
    mercadoPagoAccessToken: '',
    mercadoPagoTestPayerEmail: '',
    whatsappProvider: 'mock',
    whatsappMetaToken: '',
    whatsappMetaPhoneNumberId: '',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUnidadForm, setShowUnidadForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [showExpensaForm, setShowExpensaForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [editingUnidadId, setEditingUnidadId] = useState<string | null>(null);
  const [editingGastoId, setEditingGastoId] = useState<string | null>(null);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<ManagerApiResponse | null>(null);
  const [ownerPaymentReceipt, setOwnerPaymentReceipt] = useState<Pago | null>(null);
  const [mobileCardActionsAnchorEl, setMobileCardActionsAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileCardActions, setMobileCardActions] = useState<MobileCardAction[]>([]);
  const [mobileUnidadesDisplayCount, setMobileUnidadesDisplayCount] = useState(20);
  const [mobileGastosDisplayCount, setMobileGastosDisplayCount] = useState(20);
  const [mobileExpensasDisplayCount, setMobileExpensasDisplayCount] = useState(20);
  const [mobilePagosDisplayCount, setMobilePagosDisplayCount] = useState(20);
  const syncedOnlinePagoIdsRef = useRef<Set<string>>(new Set());
  const [manualPaymentExpensa, setManualPaymentExpensa] = useState<Expensa | null>(null);
  const [manualComprobanteFile, setManualComprobanteFile] = useState<File | null>(null);
  const [unidadEditForm, setUnidadEditForm] = useState({ numero: '', coeficiente: '', metrosCuadrados: '', propietarioId: '' });
  const [gastoEditForm, setGastoEditForm] = useState({ descripcion: '', monto: '', fecha: '' });
  const [pagoEditForm, setPagoEditForm] = useState({ monto: '', estado: 'pendiente', metodo: 'manual' as 'manual' | 'online', referencia: '', observacion: '' });
  const [ownerEditForm, setOwnerEditForm] = useState({ name: '', email: '', phoneNumber: '', password: '', unidadId: '' });
  const [selectedDetalleExpensa, setSelectedDetalleExpensa] = useState<ExpensaDetalleResponse | null>(null);

  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [expensas, setExpensas] = useState<Expensa[]>([]);
interface ManagerApiResponse extends ManagedUser {}
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [managers, setManagers] = useState<ManagerApiResponse[]>([]);
  const [owners, setOwners] = useState<OwnerApiResponse[]>([]);

  const [consorcioForm, setConsorcioForm] = useState({
    nombre: 'Consorcio Centro',
    direccion: 'Av. Principal 123',
  });
  const [unidadForm, setUnidadForm] = useState({
    numero: 'A1',
    coeficiente: '0.10',
    metrosCuadrados: '45',
    propietarioId: '',
    consorcioId: '',
  });
  const [gastoForm, setGastoForm] = useState({
    descripcion: 'Limpieza general',
    monto: '35000',
    fecha: new Date().toISOString().split('T')[0],
    consorcioId: '',
  });
  const [expensaForm, setExpensaForm] = useState({
    periodo: new Date().toISOString().slice(0, 7),
    criterioProrrateo: 'coeficiente' as 'coeficiente' | 'm2',
    consorcioId: '',
  });
  const [pagoForm, setPagoForm] = useState({
    monto: '12000',
    estado: 'pendiente',
    metodo: 'manual' as 'manual' | 'online',
    referencia: '',
    unidadId: '',
  });
  const [managerForm, setManagerForm] = useState({
    name: 'Administrador Edificio',
    email: 'manager@consorcio.com',
    phoneNumber: '',
    password: 'manager123',
    consorcioId: '',
  });

  const unidadesConsorcioExpensa = unidades.filter(
    (unidad) => unidad.consorcioId === expensaForm.consorcioId,
  );
  const unidadesSinM2 = unidadesConsorcioExpensa.filter(
    (unidad) => !unidad.metrosCuadrados || unidad.metrosCuadrados <= 0,
  ).length;
  const totalGastosPeriodo = gastos
    .filter(
      (gasto) =>
        gasto.consorcioId === gastoForm.consorcioId &&
        gasto.fecha.startsWith(expensaForm.periodo),
    )
    .reduce((acc, gasto) => acc + gasto.monto, 0);

  const syncSelectedConsorcio = (nextConsorcioId: string) => {
    setConsorcioId(nextConsorcioId);
    setReporteConsorcioId(nextConsorcioId);
    setUnidadForm((current) => ({ ...current, consorcioId: nextConsorcioId }));
    setGastoForm((current) => ({ ...current, consorcioId: nextConsorcioId }));
    setExpensaForm((current) => ({ ...current, consorcioId: nextConsorcioId }));
  };

  const syncSelectedUnidad = (nextUnidadId: string) => {
    setUnidadId(nextUnidadId);
    setPagoForm((current) => ({ ...current, unidadId: nextUnidadId }));
  };

  const getPagoUnidadLabel = (pago: Pago) =>
    pago.unidadNumero ??
    pago.unidad?.numero ??
    unidades.find((unidad) => unidad.id === pago.unidadId)?.numero ??
    pago.unidadId.slice(0, 8);

  const getPagoObservacionLabel = (pago: Pago) => {
    const referencia = pago.referencia ? `Ref: ${pago.referencia}` : '';
    const observacion = pago.observacion?.trim() ?? '';

    if (referencia && observacion) {
      return `${referencia} | ${observacion}`;
    }

    return observacion || referencia || '-';
  };

  const getPagoObservacionPreview = (pago: Pago) => {
    if (pago.referencia) {
      return `Ref: ${pago.referencia}...`;
    }

    const observacion = pago.observacion?.trim() ?? '';
    if (!observacion) {
      return '-';
    }

    return observacion.length > 24 ? `${observacion.slice(0, 24)}...` : observacion;
  };

  const getPropietarioLabel = (propietarioId?: string | null) => {
    if (!propietarioId) {
      return 'Sin asignar';
    }

    const owner = owners.find((item) => item.id === propietarioId);
    if (!owner) {
      return propietarioId.slice(0, 8);
    }

    return owner.name;
  };

  const openMobileCardActions = (event: MouseEvent<HTMLElement>, actions: MobileCardAction[]) => {
    setMobileCardActions(actions);
    setMobileCardActionsAnchorEl(event.currentTarget);
  };

  const closeMobileCardActions = () => {
    setMobileCardActionsAnchorEl(null);
    setMobileCardActions([]);
  };

  const runMobileCardAction = (action: () => void) => {
    closeMobileCardActions();
    action();
  };

  const resetSession = () => {
    setToken(null);
    setUser(null);
    setEmail('');
    setPassword('');
    setMessage('');
    setCurrentStep(0);
    setConsorcioId('');
    setUnidadId('');
    setReporteResumen(null);
    setReporteConsorcioId('');
    setOwnerPaymentReceipt(null);
    setManualPaymentExpensa(null);
    setManualComprobanteFile(null);
    setViewMode('unidades');
    setMobileMenuOpen(false);
    closeMobileCardActions();
    setMobileUnidadesDisplayCount(20);
    setMobileGastosDisplayCount(20);
    setMobileExpensasDisplayCount(20);
    setMobilePagosDisplayCount(20);
    setAuthToken(null);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      setToken(data.accessToken);
      setUser(data.user);
      setAuthToken(data.accessToken);
      setMessage('');
      setCurrentStep(data.user.role === 'owner' ? 4 : 1);
      setViewMode(data.user.role === 'owner' ? 'propietario' : 'unidades');
      setOwnerPaymentReceipt(null);
      setManualPaymentExpensa(null);
      setManualComprobanteFile(null);
      setMobileMenuOpen(false);
      await loadAllData(data.user.role);
    } catch {
      setMessage('No se pudo iniciar sesión');
    }
  };

  const loadAllData = async (targetRole?: Role) => {
    const activeRole = targetRole ?? user?.role;

    try {
      if (activeRole === 'owner') {
        const [expensasResponse, pagosResponse] = await Promise.all([
          apiClient.get<ExpensaApiResponse[]>('/expensas'),
          apiClient.get<PagoApiResponse[]>('/pagos'),
        ]);

        const nextExpensas = expensasResponse.data.map((expensa) => ({
          ...expensa,
          total: toNumber(expensa.total),
          criterioProrrateo: expensa.criterioProrrateo ?? 'coeficiente',
          unidadNumero: expensa.unidad?.numero,
        }));
        const nextPagos = pagosResponse.data.map((pago) => ({
          ...pago,
          monto: toNumber(pago.monto),
          unidadNumero: pago.unidad?.numero,
        }));

        setConsorcios([]);
        setUnidades([]);
        setGastos([]);
        setExpensas(nextExpensas);
        setPagos(nextPagos);
        setReporteResumen(null);
        setNotificacionesHistorial([]);
        setWhatsappHealth(null);
        setMobileUnidadesDisplayCount(20);
        setMobileGastosDisplayCount(20);
        setMobileExpensasDisplayCount(20);
        setMobilePagosDisplayCount(20);
        return;
      }

      const [consorciosResponse, unidadesResponse, gastosResponse, expensasResponse, pagosResponse, ownersResponse, historialResponse] = await Promise.all([
        apiClient.get<Consorcio[]>('/consorcios'),
        apiClient.get<UnidadApiResponse[]>('/unidades'),
        apiClient.get<GastoApiResponse[]>('/gastos'),
        apiClient.get<ExpensaApiResponse[]>('/expensas'),
        apiClient.get<PagoApiResponse[]>('/pagos'),
        apiClient.get<OwnerApiResponse[]>('/users/owners'),
        apiClient.get<NotificacionesHistorialResponse>('/notificaciones/historial', {
          params: {
            consorcioId: activeRole === 'admin' ? reporteConsorcioId || undefined : undefined,
            periodo: reportePeriodo,
            limit: 20,
          },
        }),
      ]);

      const nextConsorcios = consorciosResponse.data;
      const nextUnidades = unidadesResponse.data.map((unidad) => ({
        ...unidad,
        coeficiente: toNumber(unidad.coeficiente),
        metrosCuadrados:
          unidad.metrosCuadrados === null ? null : toNumber(unidad.metrosCuadrados),
      }));
      const nextGastos = gastosResponse.data.map((gasto) => ({
        ...gasto,
        monto: toNumber(gasto.monto),
      }));
      const nextExpensas = expensasResponse.data.map((expensa) => ({
        ...expensa,
        total: toNumber(expensa.total),
        criterioProrrateo: expensa.criterioProrrateo ?? 'coeficiente',
        unidadNumero: expensa.unidad?.numero,
      }));
      const nextPagos = pagosResponse.data.map((pago) => ({
        ...pago,
        monto: toNumber(pago.monto),
        unidadNumero: pago.unidad?.numero,
      }));

      setConsorcios(nextConsorcios);
      setUnidades(nextUnidades);
      setGastos(nextGastos);
      setExpensas(nextExpensas);
      setPagos(nextPagos);
      setOwners(ownersResponse.data);
      setNotificacionesHistorial(historialResponse.data.items);
      setMobileUnidadesDisplayCount(20);
      setMobileGastosDisplayCount(20);
      setMobileExpensasDisplayCount(20);
      setMobilePagosDisplayCount(20);

      if (activeRole === 'admin') {
        const managersResponse = await apiClient.get<ManagerApiResponse[]>('/users/managers');
        setManagers(managersResponse.data);
      }

      if (!consorcioId && nextConsorcios.length > 0) {
        syncSelectedConsorcio(nextConsorcios[0].id);
      }

      if (!reporteConsorcioId && nextConsorcios.length > 0) {
        setReporteConsorcioId(nextConsorcios[0].id);
      }

      if (!managerForm.consorcioId && nextConsorcios.length > 0) {
        setManagerForm((current) => ({ ...current, consorcioId: nextConsorcios[0].id }));
      }

      if (!unidadId && nextUnidades.length > 0) {
        syncSelectedUnidad(nextUnidades[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const runAction = async <T,>(
    action: () => Promise<T>,
    _successText: string,
    buildResult: (payload: T) => unknown,
  ) => {
    try {
      setIsSubmitting(true);
      const payload = await action();
      setMessage('');
      buildResult(payload);
      await loadAllData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error desconocido';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConsorcio = () =>
    runAction(
      async () => {
        const { data } = await apiClient.post<Consorcio>('/consorcios', {
          nombre: consorcioForm.nombre,
          direccion: consorcioForm.direccion,
        });
        syncSelectedConsorcio(data.id);
        return data;
      },
      'Consorcio creado',
      (consorcio) => ({
        title: 'Consorcio creado',
        description: 'Este consorcio quedó disponible para crear unidades, gastos y expensas sobre el mismo edificio.',
        fields: [
          { label: 'Nombre', value: consorcio.nombre },
          { label: 'Dirección', value: consorcio.direccion },
          { label: 'ID', value: consorcio.id },
        ],
      }),
    );

  const handleCreateUnidad = () =>
    handleCreateUnidadWithFlow(false);

  const handleCreateUnidadAndStay = () =>
    handleCreateUnidadWithFlow(true);

  const handleCreateUnidadWithFlow = (stayOnStep: boolean) =>
    runAction(
      async () => {
        const { data } = await apiClient.post<Unidad>('/unidades', {
          numero: unidadForm.numero,
          coeficiente: Number(unidadForm.coeficiente),
          metrosCuadrados:
            unidadForm.metrosCuadrados.trim() === ''
              ? undefined
              : Number(unidadForm.metrosCuadrados),
          propietarioId: unidadForm.propietarioId.trim() || undefined,
          consorcioId: unidadForm.consorcioId,
        });
        syncSelectedUnidad(data.id);
        syncSelectedConsorcio(data.consorcioId);
        setUnidadForm((current) => ({
          ...current,
          numero: '',
        }));
        if (!stayOnStep) {
          setShowUnidadForm(false);
        }
        return data;
      },
      'Unidad creada',
      (unidad) => ({
        title: 'Unidad creada',
        description: 'La unidad quedó asociada al consorcio elegido y ya se puede usar en el paso de pagos.',
        fields: [
          { label: 'Número', value: unidad.numero },
          { label: 'Coeficiente', value: unidad.coeficiente.toFixed(2) },
          {
            label: 'm2',
            value:
              unidad.metrosCuadrados === null
                ? 'No informado'
                : `${unidad.metrosCuadrados.toFixed(2)} m2`,
          },
          { label: 'Consorcio', value: unidad.consorcioId },
          { label: 'ID', value: unidad.id },
        ],
      }),
    );

  const handleOpenCreateManager = () => {
    setEditingManagerId(null);
    setManagerForm((current) => ({
      ...current,
      name: 'Administrador Edificio',
      email: 'manager@consorcio.com',
      phoneNumber: '',
      password: 'manager123',
      consorcioId: current.consorcioId || consorcios[0]?.id || '',
    }));
    setManagerModalOpen(true);
  };

  const handleOpenEditManager = (manager: ManagerApiResponse) => {
    setEditingManagerId(manager.id);
    setManagerForm({
      name: manager.name,
      email: manager.email,
      phoneNumber: manager.phoneNumber ?? '',
      password: '',
      consorcioId: manager.consorcioId ?? '',
    });
    setManagerModalOpen(true);
  };

  const handleStartEditOwner = (owner: OwnerApiResponse) => {
    const assignedUnidad = unidades.find((unidad) => unidad.propietarioId === owner.id);
    setEditingOwnerId(owner.id);
    setOwnerEditForm({
      name: owner.name,
      email: owner.email,
      phoneNumber: owner.phoneNumber ?? '',
      password: '',
      unidadId: assignedUnidad?.id ?? '',
    });
    setOwnerModalOpen(true);
  };

  const handleOpenCreateOwner = () => {
    setEditingOwnerId(null);
    setOwnerEditForm({
      name: 'Propietario Unidad',
      email: 'owner@consorcio.com',
      phoneNumber: '',
      password: 'owner123',
      unidadId: '',
    });
    setOwnerModalOpen(true);
  };

  const handleSaveOwner = () => {
    return runAction(
      async () => {
        if (editingOwnerId) {
          const { data } = await apiClient.patch<ManagedUser>(`/users/${editingOwnerId}`, {
            name: ownerEditForm.name,
            email: ownerEditForm.email,
            phoneNumber: ownerEditForm.phoneNumber.trim() || null,
            password: ownerEditForm.password.trim() || undefined,
            unidadId: ownerEditForm.unidadId || null,
          });
          setOwnerModalOpen(false);
          setEditingOwnerId(null);
          return data;
        }

        const { data } = await apiClient.post<ManagedUser>('/users', {
          name: ownerEditForm.name,
          email: ownerEditForm.email,
          phoneNumber: ownerEditForm.phoneNumber.trim() || null,
          password: ownerEditForm.password,
          role: 'owner',
          unidadId: ownerEditForm.unidadId || undefined,
        });
        setOwnerModalOpen(false);
        return data;
      },
      editingOwnerId ? 'Propietario actualizado' : 'Propietario creado',
      () => ({
        title: editingOwnerId ? 'Propietario actualizado' : 'Propietario creado',
        description: editingOwnerId
          ? 'Se actualizaron los datos del propietario y su unidad asociada.'
          : 'El propietario fue creado correctamente.',
        fields: [
          { label: 'Nombre', value: ownerEditForm.name },
          { label: 'Email', value: ownerEditForm.email },
          { label: 'WhatsApp', value: ownerEditForm.phoneNumber || 'No informado' },
          {
            label: 'Unidad',
            value: unidades.find((unidad) => unidad.id === ownerEditForm.unidadId)?.numero ?? 'Sin asignar',
          },
        ],
      }),
    );
  };

  const handleDeleteOwner = (owner: OwnerApiResponse) =>
    runAction(
      async () => {
        await apiClient.delete(`/users/${owner.id}`);
        return owner;
      },
      'Propietario eliminado',
      (deletedOwner) => ({
        title: 'Propietario eliminado',
        description: 'El propietario fue eliminado y su unidad quedó sin asignar.',
        fields: [
          { label: 'Nombre', value: deletedOwner.name },
          { label: 'Email', value: deletedOwner.email },
        ],
      }),
    );

  const handleSaveManager = () =>
    runAction(
      async () => {
        if (editingManagerId) {
          const { data } = await apiClient.patch<ManagedUser>(`/users/${editingManagerId}/manager`, {
            name: managerForm.name,
            email: managerForm.email,
            phoneNumber: managerForm.phoneNumber.trim() || null,
            password: managerForm.password.trim() || undefined,
            consorcioId: managerForm.consorcioId,
          });
          setManagerModalOpen(false);
          return data;
        }

        const { data } = await apiClient.post<ManagedUser>('/users', {
          name: managerForm.name,
          email: managerForm.email,
          phoneNumber: managerForm.phoneNumber.trim() || null,
          password: managerForm.password,
          role: 'manager',
          consorcioId: managerForm.consorcioId,
        });
        setManagerModalOpen(false);
        return data;
      },
      editingManagerId ? 'Manager actualizado' : 'Manager creado',
      (savedManager) => ({
        title: editingManagerId ? 'Manager actualizado' : 'Manager creado',
        description: editingManagerId
          ? 'Se actualizaron los datos del manager correctamente.'
          : 'El manager quedó creado y asignado a su consorcio.',
        fields: [
          { label: 'Nombre', value: savedManager.name },
          { label: 'Email', value: savedManager.email },
          { label: 'WhatsApp', value: savedManager.phoneNumber || 'No informado' },
          {
            label: 'Consorcio',
            value:
              consorcios.find((c) => c.id === savedManager.consorcioId)?.nombre ??
              savedManager.consorcioId ??
              'Sin asignar',
          },
        ],
      }),
    );

  const handleDeleteManager = (manager: ManagerApiResponse) =>
    runAction(
      async () => {
        await apiClient.delete(`/users/${manager.id}/manager`);
        return manager;
      },
      'Manager eliminado',
      (deletedManager) => ({
        title: 'Manager eliminado',
        description: 'El manager fue eliminado correctamente.',
        fields: [
          { label: 'Nombre', value: deletedManager.name },
          { label: 'Email', value: deletedManager.email },
        ],
      }),
    );

  const handleCreateGasto = () =>
    handleCreateGastoWithFlow(false);

  const handleCreateGastoAndStay = () =>
    handleCreateGastoWithFlow(true);

  const handleCreateGastoWithFlow = (stayOnStep: boolean) =>
    runAction(
      async () => {
        const { data } = await apiClient.post<Gasto>('/gastos', {
          descripcion: gastoForm.descripcion,
          monto: Number(gastoForm.monto),
          fecha: gastoForm.fecha,
          consorcioId: gastoForm.consorcioId,
        });
        syncSelectedConsorcio(data.consorcioId);
        setGastoForm((current) => ({
          ...current,
          descripcion: '',
          monto: '',
        }));
        if (!stayOnStep) {
          setShowGastoForm(false);
        }
        return data;
      },
      'Gasto registrado',
      (gasto) => ({
        title: 'Gasto registrado',
        description: 'El gasto ya forma parte del acumulado mensual del consorcio seleccionado.',
        fields: [
          { label: 'Descripción', value: gasto.descripcion },
          { label: 'Monto', value: formatMoney(gasto.monto) },
          { label: 'Fecha', value: new Date(gasto.fecha).toLocaleDateString('es-AR') },
          { label: 'Consorcio', value: gasto.consorcioId },
        ],
      }),
    );

  const handleGenerateExpensa = () =>
    runAction(
      async () => {
        const { data } = await apiClient.post<GenerarExpensaResponse>('/expensas/generar', {
          consorcioId: expensaForm.consorcioId,
          periodo: expensaForm.periodo,
          criterioProrrateo: expensaForm.criterioProrrateo,
        });
        syncSelectedConsorcio(data.consorcioId);
        setShowExpensaForm(false);
        return data;
      },
      'Expensa generada',
      (result) => ({
        title: 'Expensas generadas por unidad',
        description: 'El sistema tomó el total de gastos del edificio y lo distribuyó automáticamente en cada unidad.',
        fields: [
          { label: 'Período', value: result.periodo },
          { label: 'Total gastos edificio', value: formatMoney(result.totalGastos) },
          {
            label: 'Criterio',
            value: result.criterioProrrateo === 'm2' ? 'm2 de unidad' : 'Coeficiente',
          },
          { label: 'Cantidad de unidades', value: String(result.cantidadUnidades) },
          { label: 'Consorcio', value: result.consorcioId },
        ],
      }),
    );

  const handleCreatePago = () =>
    runAction(
      async () => {
        const { data } = await apiClient.post<Pago>('/pagos', {
          unidadId: pagoForm.unidadId,
          monto: Number(pagoForm.monto),
          estado: pagoForm.estado,
          metodo: pagoForm.metodo,
          referencia: pagoForm.referencia.trim() || undefined,
        });
        syncSelectedUnidad(data.unidadId);
        setShowPagoForm(false);
        return data;
      },
      'Pago registrado',
      (pago) => ({
        title: 'Pago registrado',
        description: 'El pago quedó imputado a la unidad elegida y ya aparece en el historial.',
        fields: [
          { label: 'Monto', value: formatMoney(pago.monto) },
          { label: 'Estado', value: pago.estado },
          { label: 'Método', value: pago.metodo === 'online' ? 'Online' : 'Manual' },
          { label: 'Fecha', value: new Date(pago.fecha).toLocaleDateString('es-AR') },
          { label: 'Unidad', value: pago.unidadId },
        ],
      }),
    );

  const handleStartEditUnidad = (unidad: Unidad) => {
    setEditingUnidadId(unidad.id);
    setUnidadEditForm({
      numero: unidad.numero,
      coeficiente: String(unidad.coeficiente),
      metrosCuadrados: unidad.metrosCuadrados == null ? '' : String(unidad.metrosCuadrados),
      propietarioId: unidad.propietarioId ?? '',
    });
  };

  const handleSaveUnidad = () => {
    if (!editingUnidadId) {
      return;
    }

    return runAction(
      async () => {
        const { data } = await apiClient.patch<Unidad>(`/unidades/${editingUnidadId}`, {
          numero: unidadEditForm.numero,
          coeficiente: Number(unidadEditForm.coeficiente),
          metrosCuadrados:
            unidadEditForm.metrosCuadrados.trim() === ''
              ? undefined
              : Number(unidadEditForm.metrosCuadrados),
          propietarioId:
            unidadEditForm.propietarioId.trim() === ''
              ? null
              : unidadEditForm.propietarioId.trim(),
        });
        setEditingUnidadId(null);
        return data;
      },
      'Unidad actualizada',
      (unidad) => ({
        title: 'Unidad actualizada',
        description: 'Los datos de la unidad se actualizaron correctamente.',
        fields: [
          { label: 'Número', value: unidad.numero },
          { label: 'Coeficiente', value: String(unidad.coeficiente) },
          {
            label: 'm2',
            value:
              unidad.metrosCuadrados === null
                ? 'No informado'
                : `${unidad.metrosCuadrados} m2`,
          },
        ],
      }),
    );
  };

  const handleDeleteUnidad = (id: string) =>
    runAction(
      async () => {
        await apiClient.delete(`/unidades/${id}`);
        return { id };
      },
      'Unidad eliminada',
      () => ({
        title: 'Unidad eliminada',
        description: 'La unidad fue eliminada del edificio.',
        fields: [],
      }),
    );

  const handleStartEditGasto = (gasto: Gasto) => {
    setShowGastoForm(false);
    setEditingGastoId(gasto.id);
    setGastoEditForm({
      descripcion: gasto.descripcion,
      monto: String(gasto.monto),
      fecha: gasto.fecha,
    });
  };

  const handleSaveGasto = () => {
    if (!editingGastoId) {
      return;
    }

    return runAction(
      async () => {
        const { data } = await apiClient.patch<Gasto>(`/gastos/${editingGastoId}`, {
          descripcion: gastoEditForm.descripcion,
          monto: Number(gastoEditForm.monto),
          fecha: gastoEditForm.fecha,
        });
        setEditingGastoId(null);
        return data;
      },
      'Gasto actualizado',
      (gasto) => ({
        title: 'Gasto actualizado',
        description: 'Se actualizó el gasto común del mes.',
        fields: [
          { label: 'Descripción', value: gasto.descripcion },
          { label: 'Monto', value: formatMoney(gasto.monto) },
        ],
      }),
    );
  };

  const handleDeleteGasto = (id: string) =>
    runAction(
      async () => {
        await apiClient.delete(`/gastos/${id}`);
        return { id };
      },
      'Gasto eliminado',
      () => ({
        title: 'Gasto eliminado',
        description: 'El registro de gasto fue eliminado.',
        fields: [],
      }),
    );

  const handleStartEditPago = (pago: Pago) => {
    setShowPagoForm(false);
    setEditingPagoId(pago.id);
    setPagoEditForm({
      monto: String(pago.monto),
      estado: pago.estado,
      metodo: pago.metodo,
      referencia: pago.referencia ?? '',
      observacion: pago.observacion ?? '',
    });
  };

  const handleSavePago = () => {
    if (!editingPagoId) {
      return;
    }

    return runAction(
      async () => {
        const { data } = await apiClient.patch<Pago>(`/pagos/${editingPagoId}`, {
          monto: Number(pagoEditForm.monto),
          estado: pagoEditForm.estado,
          metodo: pagoEditForm.metodo,
          referencia: pagoEditForm.referencia.trim() || null,
          observacion: pagoEditForm.observacion.trim() || null,
        });
        setEditingPagoId(null);
        return data;
      },
      'Pago actualizado',
      (pago) => ({
        title: 'Pago actualizado',
        description: 'Se actualizó el registro de pago.',
        fields: [
          { label: 'Monto', value: formatMoney(pago.monto) },
          { label: 'Estado', value: pago.estado },
          { label: 'Método', value: pago.metodo },
          { label: 'Observación', value: pago.observacion ?? '-' },
        ],
      }),
    );
  };

  const handleDeletePago = (id: string) =>
    runAction(
      async () => {
        await apiClient.delete(`/pagos/${id}`);
        return { id };
      },
      'Pago eliminado',
      () => ({
        title: 'Pago eliminado',
        description: 'El registro de pago fue eliminado.',
        fields: [],
      }),
    );

  const handleDeleteExpensa = (id: string) =>
    runAction(
      async () => {
        await apiClient.delete(`/expensas/${id}`);
        return { id };
      },
      'Expensa eliminada',
      () => ({
        title: 'Expensa eliminada',
        description: 'La expensa seleccionada fue eliminada.',
        fields: [],
      }),
    );

  const handleOpenExpensaPdf = async (expensaId: string) => {
    try {
      const { data } = await apiClient.get(`/expensas/${expensaId}/pdf`, {
        responseType: 'blob',
      });
      const fileUrl = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo abrir el PDF';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const handleOpenComprobante = (comprobanteUrl: string | null) => {
    if (!comprobanteUrl) {
      return;
    }

    const apiBase = String(apiClient.defaults.baseURL ?? '');
    const backendBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    const absoluteUrl =
      comprobanteUrl.startsWith('http') ? comprobanteUrl : `${backendBase}${comprobanteUrl}`;
    window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
  };

  const handleVerDetalleExpensa = () =>
    runAction(
      async () => {
        const expensa = expensas.find((item) => item.unidadId === unidadId);

        if (!expensa) {
          throw new Error('No hay expensa generada para la unidad seleccionada');
        }

        const { data } = await apiClient.get<ExpensaDetalleResponse>(`/expensas/${expensa.id}/detalle`);
        setSelectedDetalleExpensa(data);
        await handleOpenExpensaPdf(expensa.id);
        return data;
      },
      'Detalle de expensa cargado',
      (detalle) => ({
        title: 'Detalle listo para PDF',
        description: 'Ya tienes el detalle completo por unidad para visualizar o enviar.',
        fields: [
          { label: 'Unidad', value: detalle.expensa.unidadNumero ?? 'N/D' },
          { label: 'Período', value: detalle.expensa.periodo },
          { label: 'Total unidad', value: formatMoney(detalle.expensa.total) },
          { label: 'PDF', value: detalle.resumen.pdfUrl },
        ],
      }),
    );

  const handlePagarExpensa = (expensa: Expensa, metodo: 'manual' | 'online') =>
    runAction(
      async () => {
        if (!expensa.unidadId) {
          throw new Error('La expensa no tiene unidad asociada');
        }

        if (metodo === 'manual' && !manualComprobanteFile) {
          throw new Error('Debes adjuntar un comprobante PDF para registrar pago manual');
        }

        const { data } = await apiClient.post<Pago>('/pagos', {
          unidadId: expensa.unidadId,
          monto: expensa.total,
          estado: metodo === 'online' ? 'aprobado' : 'pendiente',
          metodo,
          referencia: metodo === 'online' ? `ONLINE-${Date.now()}` : undefined,
        });

        if (metodo === 'manual' && manualComprobanteFile) {
          const formData = new FormData();
          formData.append('file', manualComprobanteFile);
          const uploaded = await apiClient.post<Pago>(`/pagos/${data.id}/comprobante`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setManualPaymentExpensa(null);
          setManualComprobanteFile(null);
          return uploaded.data;
        }

        return data;
      },
      metodo === 'online' ? 'Pago online registrado' : 'Pago manual informado',
      (pago) => {
        setOwnerPaymentReceipt(pago);
        return {
        title: metodo === 'online' ? 'Pago online completado' : 'Pago manual registrado',
        description: 'El pago quedó asociado a la unidad del propietario.',
        fields: [
          { label: 'Monto', value: formatMoney(pago.monto) },
          { label: 'Método', value: pago.metodo === 'online' ? 'Online' : 'Manual' },
          { label: 'Estado', value: pago.estado },
          { label: 'Referencia', value: pago.referencia ?? '-' },
          { label: 'Comprobante', value: pago.comprobanteUrl ?? '-' },
        ],
        };
      },
    );

  const handlePagarOnlineMercadoPago = async (expensa: Expensa) => {
    const checkoutWindow = window.open('', '_blank');

    try {
      setIsSubmitting(true);
      const { data } = await apiClient.post<MercadoPagoPreferenceResponse>(
        '/pagos/mercadopago/preferencia',
        { expensaId: expensa.id },
      );
      const redirectUrl = data.initPoint || data.sandboxInitPoint;
      if (!redirectUrl) {
        throw new Error('Mercado Pago no devolvió URL de checkout');
      }

      if (checkoutWindow) {
        checkoutWindow.location.href = redirectUrl;
      } else {
        // Fallback if popup was blocked.
        window.location.href = redirectUrl;
      }

      setMessage('Checkout abierto en otra pestaña. Vuelve aquí al finalizar para sincronizar el pago.');
      setIsSubmitting(false);
    } catch (error: any) {
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.close();
      }

      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo iniciar el pago online';
      setMessage(`Error: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  const syncMercadoPagoReturnIfNeeded = async () => {
    const params = new URLSearchParams(window.location.search);
    const pagoId = params.get('pagoId');
    if (!pagoId) {
      return;
    }

    try {
      const { data } = await apiClient.post<Pago>(`/pagos/${pagoId}/mercadopago/sync`);
      const normalizedPago = {
        ...data,
        monto: toNumber((data as unknown as { monto: string | number }).monto),
      };
      setOwnerPaymentReceipt(normalizedPago);
      await loadAllData('owner');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo sincronizar el pago online';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, '', cleanUrl);
      setIsSubmitting(false);
    }
  };

  const syncPendingOwnerOnlinePayments = async () => {
    const pendingOnlinePayments = pagos.filter(
      (pago) =>
        pago.metodo === 'online' &&
        (pago.estado === 'pendiente' || !pago.referencia || !pago.comprobanteUrl) &&
        !syncedOnlinePagoIdsRef.current.has(pago.id),
    );

    if (pendingOnlinePayments.length === 0) {
      return;
    }

    let latestSyncedPago: Pago | null = null;

    for (const pago of pendingOnlinePayments) {
      syncedOnlinePagoIdsRef.current.add(pago.id);

      try {
        const { data } = await apiClient.post<Pago>(`/pagos/${pago.id}/mercadopago/sync`);
        latestSyncedPago = {
          ...data,
          monto: toNumber((data as unknown as { monto: string | number }).monto),
          unidadNumero: data.unidad?.numero,
        };
      } catch (error) {
        console.error('No se pudo sincronizar el pago online pendiente', pago.id, error);
      }
    }

    if (latestSyncedPago) {
      setOwnerPaymentReceipt(latestSyncedPago);
      await loadAllData('owner');
    }
  };

  const latestOwnerPayments = [...pagos]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);

  const handleLoadReporte = async () => {
    try {
      if (user?.role === 'admin' && !reporteConsorcioId) {
        setMessage('Selecciona un consorcio para consultar el reporte.');
        return;
      }

      setReporteLoading(true);
      const { data } = await apiClient.get<ReporteResumen>('/reportes', {
        params: {
          consorcioId: reporteConsorcioId || undefined,
          periodo: reportePeriodo,
        },
      });
      setReporteResumen(data);
      setMessage('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo cargar el reporte';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setReporteLoading(false);
    }
  };

  const handleSendPendingReminders = async () => {
    try {
      if (user?.role === 'admin' && !reporteConsorcioId) {
        setMessage('Selecciona un consorcio para enviar recordatorios.');
        return;
      }

      setRecordatorioLoading(true);
      const { data } = await apiClient.post<RecordatorioPendientesResponse>(
        '/notificaciones/recordatorios/pagos-pendientes',
        {
          periodo: reportePeriodo,
          consorcioId: reporteConsorcioId || undefined,
        },
      );
      setRecordatorioResultado(data);
      await handleLoadNotificationHistory();
      setMessage('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudieron enviar recordatorios';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setRecordatorioLoading(false);
    }
  };

  const handleLoadNotificationHistory = async () => {
    try {
      setHistorialLoading(true);
      const { data } = await apiClient.get<NotificacionesHistorialResponse>('/notificaciones/historial', {
        params: {
          periodo: reportePeriodo || undefined,
          consorcioId: user?.role === 'admin' ? reporteConsorcioId || undefined : undefined,
          limit: 20,
        },
      });
      setNotificacionesHistorial(data.items);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo cargar el historial de notificaciones';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleLoadWhatsappHealth = async () => {
    try {
      setWhatsappHealthLoading(true);
      const { data } = await apiClient.get<WhatsappHealthResponse>('/notificaciones/whatsapp/health', {
        params: {
          consorcioId: user?.role === 'admin' ? reporteConsorcioId || undefined : undefined,
        },
      });
      setWhatsappHealth(data);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo validar WhatsApp';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setWhatsappHealthLoading(false);
    }
  };

  const handleSendWhatsappTest = async () => {
    try {
      if (!whatsappTestPhone.trim()) {
        setMessage('Ingresa un teléfono para la prueba de WhatsApp.');
        return;
      }

      if (user?.role === 'admin' && !reporteConsorcioId) {
        setMessage('Selecciona un consorcio para registrar la prueba en el historial.');
        return;
      }

      setWhatsappTestLoading(true);
      const { data } = await apiClient.post<WhatsappTestResponse>('/notificaciones/whatsapp/test', {
        telefono: whatsappTestPhone,
        mensaje: whatsappTestMessage || undefined,
        periodo: reportePeriodo || undefined,
        consorcioId: user?.role === 'admin' ? reporteConsorcioId || undefined : undefined,
      });
      setWhatsappTestResult(data);
      await handleLoadNotificationHistory();
      setMessage('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo enviar la prueba de WhatsApp';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setWhatsappTestLoading(false);
    }
  };

  const handleLoadConsorcioIntegracion = async () => {
    if (user?.role !== 'admin') {
      return;
    }

    if (!reporteConsorcioId) {
      setMessage('Selecciona un consorcio para gestionar integraciones.');
      return;
    }

    try {
      setIntegracionLoading(true);
      const { data } = await apiClient.get<ConsorcioIntegracionResponse>(`/consorcios/${reporteConsorcioId}/integracion`);
      setIntegracionMeta(data);
      setIntegracionForm({
        mode: data.mode,
        active: data.active,
        mercadoPagoAccessToken: '',
        mercadoPagoTestPayerEmail: data.mercadoPagoTestPayerEmail ?? '',
        whatsappProvider: data.whatsappProvider ?? 'mock',
        whatsappMetaToken: '',
        whatsappMetaPhoneNumberId: data.whatsappMetaPhoneNumberId ?? '',
      });
      setMessage('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo cargar la configuración de integraciones';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setIntegracionLoading(false);
    }
  };

  const handleSaveConsorcioIntegracion = async () => {
    if (user?.role !== 'admin') {
      return;
    }

    if (!reporteConsorcioId) {
      setMessage('Selecciona un consorcio para guardar integraciones.');
      return;
    }

    try {
      setIntegracionSaving(true);
      const payload = {
        mode: integracionForm.mode,
        active: integracionForm.active,
        mercadoPagoAccessToken: integracionForm.mercadoPagoAccessToken || undefined,
        mercadoPagoTestPayerEmail: integracionForm.mercadoPagoTestPayerEmail || undefined,
        whatsappProvider: integracionForm.whatsappProvider || undefined,
        whatsappMetaToken: integracionForm.whatsappMetaToken || undefined,
        whatsappMetaPhoneNumberId: integracionForm.whatsappMetaPhoneNumberId || undefined,
      };

      await apiClient.put(`/consorcios/${reporteConsorcioId}/integracion`, payload);
      await handleLoadConsorcioIntegracion();
      await handleLoadWhatsappHealth();
      setIntegracionForm((current) => ({
        ...current,
        mercadoPagoAccessToken: '',
        whatsappMetaToken: '',
      }));
      setMessage('Integraciones guardadas para el consorcio seleccionado.');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo guardar la configuración de integraciones';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setIntegracionSaving(false);
    }
  };

  const renderStepForm = () => {
    if (currentStep === 0) {
      return (
        <Stack spacing={2}>
          <TextField
            label="Nombre del consorcio"
            value={consorcioForm.nombre}
            onChange={(event) => setConsorcioForm((current) => ({ ...current, nombre: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Dirección"
            value={consorcioForm.direccion}
            onChange={(event) => setConsorcioForm((current) => ({ ...current, direccion: event.target.value }))}
            fullWidth
          />
        </Stack>
      );
    }

    if (currentStep === 1) {
      return (
        <Stack spacing={2}>
          <TextField
            select
            label="Consorcio destino"
            value={unidadForm.consorcioId}
            onChange={(event) => {
              const nextId = event.target.value;
              setUnidadForm((current) => ({ ...current, consorcioId: nextId }));
              syncSelectedConsorcio(nextId);
            }}
            fullWidth
          >
            {consorcios.map((consorcio) => (
              <MenuItem key={consorcio.id} value={consorcio.id}>
                {consorcio.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Número de unidad"
            value={unidadForm.numero}
            onChange={(event) => setUnidadForm((current) => ({ ...current, numero: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Coeficiente"
            type="number"
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            value={unidadForm.coeficiente}
            onChange={(event) => setUnidadForm((current) => ({ ...current, coeficiente: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Metros cuadrados (opcional)"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={unidadForm.metrosCuadrados}
            onChange={(event) =>
              setUnidadForm((current) => ({ ...current, metrosCuadrados: event.target.value }))
            }
            fullWidth
          />
          <TextField
            select
            label="Propietario (opcional)"
            value={unidadForm.propietarioId}
            onChange={(event) =>
              setUnidadForm((current) => ({ ...current, propietarioId: event.target.value }))
            }
            fullWidth
          >
            <MenuItem value="">Sin asignar</MenuItem>
            {owners.map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name} ({owner.email})
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      );
    }

    if (currentStep === 2) {
      return (
        <Stack spacing={2}>
          <TextField
            select
            label="Consorcio del gasto"
            value={gastoForm.consorcioId}
            onChange={(event) => {
              const nextId = event.target.value;
              setGastoForm((current) => ({ ...current, consorcioId: nextId }));
              syncSelectedConsorcio(nextId);
            }}
            fullWidth
          >
            {consorcios.map((consorcio) => (
              <MenuItem key={consorcio.id} value={consorcio.id}>
                {consorcio.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Descripción"
            value={gastoForm.descripcion}
            onChange={(event) => setGastoForm((current) => ({ ...current, descripcion: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Monto"
            type="number"
            inputProps={{ min: 0.01, step: 0.01 }}
            value={gastoForm.monto}
            onChange={(event) => setGastoForm((current) => ({ ...current, monto: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Fecha"
            type="date"
            value={gastoForm.fecha}
            onChange={(event) => setGastoForm((current) => ({ ...current, fecha: event.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      );
    }

    if (currentStep === 3) {
      return (
        <Stack spacing={2}>
          <TextField
            select
            label="Consorcio a liquidar"
            value={expensaForm.consorcioId}
            onChange={(event) => {
              const nextId = event.target.value;
              setExpensaForm((current) => ({ ...current, consorcioId: nextId }));
              syncSelectedConsorcio(nextId);
            }}
            fullWidth
          >
            {consorcios.map((consorcio) => (
              <MenuItem key={consorcio.id} value={consorcio.id}>
                {consorcio.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Período"
            type="month"
            value={expensaForm.periodo}
            onChange={(event) => setExpensaForm((current) => ({ ...current, periodo: event.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Criterio de reparto"
            value={expensaForm.criterioProrrateo}
            onChange={(event) =>
              setExpensaForm((current) => ({
                ...current,
                criterioProrrateo: event.target.value as 'coeficiente' | 'm2',
              }))
            }
            fullWidth
          >
            <MenuItem value="coeficiente">Coeficiente de unidad</MenuItem>
            <MenuItem value="m2">Metros cuadrados de unidad</MenuItem>
          </TextField>
        </Stack>
      );
    }

    return (
      <Stack spacing={2}>
        <TextField
          select
          label="Unidad"
          value={pagoForm.unidadId}
          onChange={(event) => {
            const nextId = event.target.value;
            setPagoForm((current) => ({ ...current, unidadId: nextId }));
            syncSelectedUnidad(nextId);
          }}
          fullWidth
        >
          {unidades.map((unidad) => (
            <MenuItem key={unidad.id} value={unidad.id}>
              {unidad.numero}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Monto"
          type="number"
          inputProps={{ min: 0.01, step: 0.01 }}
          value={pagoForm.monto}
          onChange={(event) => setPagoForm((current) => ({ ...current, monto: event.target.value }))}
          fullWidth
        />
        <TextField
          select
          label="Estado"
          value={pagoForm.estado}
          onChange={(event) => setPagoForm((current) => ({ ...current, estado: event.target.value }))}
          fullWidth
        >
          <MenuItem value="pendiente">Pendiente</MenuItem>
          <MenuItem value="aprobado">Aprobado</MenuItem>
          <MenuItem value="rechazado">Rechazado</MenuItem>
        </TextField>
        <TextField
          select
          label="Método"
          value={pagoForm.metodo}
          onChange={(event) =>
            setPagoForm((current) => ({ ...current, metodo: event.target.value as 'manual' | 'online' }))
          }
          fullWidth
        >
          <MenuItem value="manual">Manual</MenuItem>
          <MenuItem value="online">Online</MenuItem>
        </TextField>
        <TextField
          label="Referencia de pago (opcional)"
          value={pagoForm.referencia}
          onChange={(event) => setPagoForm((current) => ({ ...current, referencia: event.target.value }))}
          fullWidth
        />
      </Stack>
    );
  };

  const renderStepAction = () => {
    if (currentStep === 0) {
      const isManager = user?.role === 'manager';
      return {
        title: 'Crear consorcio',
        description: isManager
          ? 'El alta de nuevos consorcios corresponde al administrador general. Como manager operas sobre el consorcio ya asignado.'
          : 'Acá defines el edificio o consorcio. En un esquema multi-edificio, este es el contenedor principal de unidades, gastos y expensas.',
        action: handleCreateConsorcio,
        buttonLabel: 'Guardar consorcio',
        disabled:
          isManager ||
          !consorcioForm.nombre.trim() ||
          !consorcioForm.direccion.trim(),
      };
    }

    if (currentStep === 1) {
      return {
        title: 'Crear unidad',
        description: 'El administrador del consorcio crea las unidades dentro del edificio elegido. Ya puedes cargar número y coeficiente reales.',
        action: handleCreateUnidad,
        buttonLabel: 'Guardar unidad',
        disabled:
          !unidadForm.consorcioId ||
          !unidadForm.numero.trim() ||
          Number.isNaN(Number(unidadForm.coeficiente)) ||
          Number(unidadForm.coeficiente) <= 0,
      };
    }

    if (currentStep === 2) {
      return {
        title: 'Registrar gasto',
        description:
          'Puedes cargar todos los gastos del edificio en este paso. El total mensual del consorcio se usa luego para generar expensas por unidad.',
        action: handleCreateGasto,
        buttonLabel: 'Guardar gasto',
        disabled:
          !gastoForm.consorcioId ||
          !gastoForm.descripcion.trim() ||
          Number.isNaN(Number(gastoForm.monto)) ||
          Number(gastoForm.monto) <= 0 ||
          !gastoForm.fecha,
      };
    }

    if (currentStep === 3) {
      return {
        title: 'Generar expensa',
        description:
          expensaForm.criterioProrrateo === 'm2'
            ? 'La liquidación reparte el total del edificio según metros cuadrados de cada unidad.'
            : 'La liquidación reparte el total del edificio según coeficiente de cada unidad.',
        action: handleGenerateExpensa,
        buttonLabel: 'Generar expensa',
        disabled:
          !expensaForm.consorcioId ||
          !expensaForm.periodo ||
          unidadesConsorcioExpensa.length === 0 ||
          (expensaForm.criterioProrrateo === 'm2' && unidadesSinM2 > 0),
      };
    }

    return {
      title: 'Registrar pago',
      description: 'Registra el pago por unidad indicando método manual u online. Este módulo representa el cobro y conciliación.',
      action: handleCreatePago,
      buttonLabel: 'Guardar pago',
      disabled:
        !pagoForm.unidadId ||
        Number.isNaN(Number(pagoForm.monto)) ||
        Number(pagoForm.monto) <= 0 ||
        !pagoForm.estado,
    };
  };

  const renderModuleGrid = () => {
    if (viewMode === 'unidades') {
      return (
        <>
          <Stack spacing={0.85} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {unidades.slice(0, mobileUnidadesDisplayCount).map((unidad) => (
              <Paper key={`manager-unidad-card-${unidad.id}`} elevation={0} sx={{ p: 1.1, borderRadius: 1.75, border: '1px solid #dce9e4' }}>
                <Stack spacing={0.35}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                      Unidad {unidad.numero}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ p: 0.2 }}
                      onClick={(event) =>
                        openMobileCardActions(event, [
                          { label: 'Editar', onClick: () => handleStartEditUnidad(unidad) },
                          { label: 'Eliminar', onClick: () => handleDeleteUnidad(unidad.id), tone: 'danger' },
                        ])
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Coef: {unidad.coeficiente.toFixed(2)} | m2: {unidad.metrosCuadrados == null ? '-' : unidad.metrosCuadrados.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Prop: {getPropietarioLabel(unidad.propietarioId)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {mobileUnidadesDisplayCount < unidades.length && (
              <Button fullWidth size="small" onClick={() => setMobileUnidadesDisplayCount(prev => prev + 20)}>
                Cargar más unidades
              </Button>
            )}
          </Stack>

          <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell align="right">Coef.</TableCell>
                  <TableCell align="right">m2</TableCell>
                  <TableCell>Propietario</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unidades.map((unidad) => (
                  <TableRow key={unidad.id}>
                    <TableCell>{unidad.numero}</TableCell>
                    <TableCell align="right">{unidad.coeficiente.toFixed(2)}</TableCell>
                    <TableCell align="right">{unidad.metrosCuadrados == null ? '-' : unidad.metrosCuadrados.toFixed(2)}</TableCell>
                    <TableCell>{getPropietarioLabel(unidad.propietarioId)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => handleStartEditUnidad(unidad)}>Editar</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteUnidad(unidad.id)}>Eliminar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      );
    }

    if (viewMode === 'gastos') {
      return (
        <>
          <Stack spacing={0.85} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {gastos.slice(0, mobileGastosDisplayCount).map((gasto) => (
              <Paper key={`manager-gasto-card-${gasto.id}`} elevation={0} sx={{ p: 1.1, borderRadius: 1.75, border: '1px solid #dce9e4' }}>
                <Stack spacing={0.35}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                      {gasto.descripcion}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ p: 0.2 }}
                      onClick={(event) =>
                        openMobileCardActions(event, [
                          { label: 'Editar', onClick: () => handleStartEditGasto(gasto) },
                          { label: 'Eliminar', onClick: () => handleDeleteGasto(gasto.id), tone: 'danger' },
                        ])
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Fecha: {new Date(gasto.fecha).toLocaleDateString('es-AR')}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {formatMoney(gasto.monto)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {mobileGastosDisplayCount < gastos.length && (
              <Button fullWidth size="small" onClick={() => setMobileGastosDisplayCount(prev => prev + 20)}>
                Cargar más gastos
              </Button>
            )}
          </Stack>

          <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>{gasto.descripcion}</TableCell>
                    <TableCell>{new Date(gasto.fecha).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell align="right">{formatMoney(gasto.monto)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => handleStartEditGasto(gasto)}>Editar</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteGasto(gasto.id)}>Eliminar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      );
    }

    if (viewMode === 'expensas') {
      return (
        <>
          <Stack spacing={0.85} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {expensas.slice(0, mobileExpensasDisplayCount).map((expensa) => (
              <Paper key={`manager-expensa-card-${expensa.id}`} elevation={0} sx={{ p: 1.1, borderRadius: 1.75, border: '1px solid #dce9e4' }}>
                <Stack spacing={0.35}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                      Período {expensa.periodo}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ p: 0.2 }}
                      onClick={(event) =>
                        openMobileCardActions(event, [
                          { label: 'Ver PDF', onClick: () => handleOpenExpensaPdf(expensa.id) },
                          { label: 'Eliminar', onClick: () => handleDeleteExpensa(expensa.id), tone: 'danger' },
                        ])
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Unidad: {expensa.unidadNumero ?? expensa.unidadId?.slice(0, 8) ?? 'N/D'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Criterio: {expensa.criterioProrrateo === 'm2' ? 'm2' : 'Coeficiente'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {formatMoney(expensa.total)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {mobileExpensasDisplayCount < expensas.length && (
              <Button fullWidth size="small" onClick={() => setMobileExpensasDisplayCount(prev => prev + 20)}>
                Cargar más expensas
              </Button>
            )}
          </Stack>

          <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Criterio</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expensas.map((expensa) => (
                  <TableRow key={expensa.id}>
                    <TableCell>{expensa.periodo}</TableCell>
                    <TableCell>{expensa.unidadNumero ?? expensa.unidadId?.slice(0, 8) ?? 'N/D'}</TableCell>
                    <TableCell>{expensa.criterioProrrateo === 'm2' ? 'm2' : 'Coeficiente'}</TableCell>
                    <TableCell align="right">{formatMoney(expensa.total)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={() => handleOpenExpensaPdf(expensa.id)}
                        >
                          Ver PDF
                        </Button>
                        <Button size="small" color="error" onClick={() => handleDeleteExpensa(expensa.id)}>Eliminar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      );
    }

    if (viewMode === 'pagos') {
      return (
        <>
          <Stack spacing={0.85} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {pagos.slice(0, mobilePagosDisplayCount).map((pago) => (
              <Paper key={`manager-pago-card-${pago.id}`} elevation={0} sx={{ p: 1.1, borderRadius: 1.75, border: '1px solid #dce9e4' }}>
                <Stack spacing={0.35}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                      {new Date(pago.fecha).toLocaleDateString('es-AR')}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ p: 0.2 }}
                      onClick={(event) =>
                        openMobileCardActions(event, [
                          ...(pago.comprobanteUrl
                            ? [
                                {
                                  label: 'Ver comprobante',
                                  onClick: () => handleOpenComprobante(pago.comprobanteUrl as string),
                                },
                              ]
                            : []),
                          { label: 'Editar', onClick: () => handleStartEditPago(pago) },
                          { label: 'Eliminar', onClick: () => handleDeletePago(pago.id), tone: 'danger' },
                        ])
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Unidad: {getPagoUnidadLabel(pago)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {formatMoney(pago.monto)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estado: {pago.estado} | Método: {pago.metodo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" title={getPagoObservacionLabel(pago)}>
                    {getPagoObservacionPreview(pago)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pago.comprobanteUrl ? 'Con comprobante' : 'Sin comprobante'}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {mobilePagosDisplayCount < pagos.length && (
              <Button fullWidth size="small" onClick={() => setMobilePagosDisplayCount(prev => prev + 20)}>
                Cargar más pagos
              </Button>
            )}
          </Stack>

          <TableContainer component={Paper} sx={{ overflowX: 'hidden', display: { xs: 'none', md: 'block' } }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ width: '8%' }}>Unidad</TableCell>
                  <TableCell align="right" sx={{ width: '11%' }}>Monto</TableCell>
                  <TableCell sx={{ width: '10%' }}>Estado</TableCell>
                  <TableCell sx={{ width: '9%' }}>Método</TableCell>
                  <TableCell sx={{ width: '18%' }}>Observación</TableCell>
                  <TableCell sx={{ width: '10%' }}>Fecha</TableCell>
                  <TableCell sx={{ width: '10%', pr: 2 }}>Comprobante</TableCell>
                  <TableCell sx={{ width: '12%', pl: 2 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>{getPagoUnidadLabel(pago)}</TableCell>
                    <TableCell align="right">{formatMoney(pago.monto)}</TableCell>
                    <TableCell>{pago.estado}</TableCell>
                    <TableCell>{pago.metodo}</TableCell>
                    <TableCell>
                      <Box
                        title={getPagoObservacionLabel(pago)}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {getPagoObservacionPreview(pago)}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(pago.fecha).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell sx={{ pr: 2 }}>
                      {pago.comprobanteUrl ? (
                        <Button size="small" sx={{ minWidth: 0, px: 0.5 }} onClick={() => handleOpenComprobante(pago.comprobanteUrl)}>Ver</Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ pl: 2 }}>
                      <Stack direction="column" spacing={0.5}>
                        <Button size="small" sx={{ minWidth: 0, px: 0.5 }} onClick={() => handleStartEditPago(pago)}>Editar</Button>
                        <Button size="small" color="error" sx={{ minWidth: 0, px: 0.5 }} onClick={() => handleDeletePago(pago.id)}>Eliminar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      );
    }

    return null;
  };

  const getValidationMessages = (): string[] => {
    if (currentStep === 1) {
      const issues: string[] = [];
      if (!unidadForm.consorcioId) issues.push('Selecciona un consorcio.');
      if (!unidadForm.numero.trim()) issues.push('Ingresa el numero de unidad.');
      if (Number.isNaN(Number(unidadForm.coeficiente)) || Number(unidadForm.coeficiente) <= 0) {
        issues.push('El coeficiente debe ser mayor a 0.');
      }
      return issues;
    }

    if (currentStep === 2) {
      const issues: string[] = [];
      if (!gastoForm.consorcioId) issues.push('Selecciona un consorcio.');
      if (!gastoForm.descripcion.trim()) issues.push('Ingresa la descripcion del gasto.');
      if (Number.isNaN(Number(gastoForm.monto)) || Number(gastoForm.monto) <= 0) {
        issues.push('El monto debe ser mayor a 0.');
      }
      if (!gastoForm.fecha) issues.push('Selecciona la fecha del gasto.');
      return issues;
    }

    if (currentStep === 3) {
      const issues: string[] = [];
      if (!expensaForm.consorcioId) issues.push('Selecciona un consorcio a liquidar.');
      if (!expensaForm.periodo) issues.push('Selecciona un periodo.');
      if (unidadesConsorcioExpensa.length === 0) issues.push('No hay unidades en el consorcio seleccionado.');
      if (expensaForm.criterioProrrateo === 'm2' && unidadesSinM2 > 0) {
        issues.push('Hay unidades sin m2 cargados para liquidar por metros cuadrados.');
      }
      return issues;
    }

    if (currentStep === 4) {
      const issues: string[] = [];
      if (!pagoForm.unidadId) issues.push('Selecciona una unidad.');
      if (Number.isNaN(Number(pagoForm.monto)) || Number(pagoForm.monto) <= 0) {
        issues.push('El monto del pago debe ser mayor a 0.');
      }
      if (!pagoForm.estado) issues.push('Selecciona un estado de pago.');
      return issues;
    }

    return [];
  };

  const currentAction = renderStepAction();
  const validationMessages = getValidationMessages();
  const totalRegistros = consorcios.length + unidades.length + gastos.length + expensas.length + pagos.length;
  const moduleStepByView: Partial<Record<ViewMode, number>> = {
    unidades: 1,
    gastos: 2,
    expensas: 3,
    pagos: 4,
  };

  const selectView = (nextView: ViewMode) => {
    setViewMode(nextView);
    const targetStep = moduleStepByView[nextView];
    if (typeof targetStep === 'number') {
      setCurrentStep(targetStep);
    }
  };

  const navItems: Array<{
    key: ViewMode;
    title: string;
    subtitle: string;
    meta: string;
    visible: boolean;
  }> = [
    {
      key: 'unidades',
      title: 'Unidades',
      subtitle: 'Alta, edición y baja',
      meta: `${unidades.length} unidades`,
      visible: user?.role !== 'owner',
    },
    {
      key: 'gastos',
      title: 'Gastos del mes',
      subtitle: 'Carga de gastos comunes',
      meta: `${gastos.length} gastos`,
      visible: user?.role !== 'owner',
    },
    {
      key: 'expensas',
      title: 'Generar expensas',
      subtitle: 'Liquidación por unidad',
      meta: `${expensas.length} expensas`,
      visible: user?.role !== 'owner',
    },
    {
      key: 'pagos',
      title: 'Registrar pago',
      subtitle: 'Manual u online',
      meta: `${pagos.length} pagos`,
      visible: user?.role !== 'owner',
    },
    {
      key: 'propietario',
      title: 'Portal propietario',
      subtitle: 'Ver expensa y pagar',
      meta: `${expensas.length} expensas`,
      visible: user?.role === 'owner',
    },
    {
      key: 'reportes',
      title: 'Reportes',
      subtitle: 'Resumen mensual',
      meta: reportePeriodo,
      visible: user?.role !== 'owner',
    },
    {
      key: 'configuracion',
      title: 'Configuración',
      subtitle: 'Integraciones y notificaciones',
      meta: 'WhatsApp y Mercado Pago',
      visible: user?.role === 'admin',
    },
    {
      key: 'data',
      title: 'Tablas y registros',
      subtitle: 'Consulta historial completo',
      meta: `${totalRegistros} registros`,
      visible: true,
    },
    {
      key: 'admin',
      title: 'Administración',
      subtitle: 'Alta de managers',
      meta: `${consorcios.length} consorcios`,
      visible: user?.role === 'admin',
    },
  ];

  const viewTitleByMode: Record<ViewMode, string> = {
    unidades: 'Unidades',
    gastos: 'Gastos',
    expensas: 'Expensas',
    pagos: 'Pagos',
    propietario: 'Portal propietario',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    data: 'Tablas',
    admin: 'Administración',
  };
  const viewTitle = viewTitleByMode[viewMode];

  const navIconByView: Record<ViewMode, ReactNode> = {
    unidades: <ApartmentIcon fontSize="small" />,
    gastos: <ReceiptLongIcon fontSize="small" />,
    expensas: <DescriptionIcon fontSize="small" />,
    pagos: <PaymentsIcon fontSize="small" />,
    propietario: <PersonIcon fontSize="small" />,
    reportes: <QueryStatsIcon fontSize="small" />,
    configuracion: <AdminPanelSettingsIcon fontSize="small" />,
    data: <TableChartIcon fontSize="small" />,
    admin: <AdminPanelSettingsIcon fontSize="small" />,
  };

  const moduleButtonLabelByView: Partial<Record<ViewMode, string>> = {
    unidades: 'Nueva unidad',
    gastos: 'Nuevo gasto',
    expensas: 'Nueva liquidación',
    pagos: 'Nuevo pago',
  };

  const isModuleFormVisible =
    (viewMode === 'unidades' && showUnidadForm) ||
    (viewMode === 'gastos' && showGastoForm) ||
    (viewMode === 'expensas' && showExpensaForm) ||
    (viewMode === 'pagos' && showPagoForm);

  const openModuleForm = () => {
    setEditingUnidadId(null);
    setEditingGastoId(null);
    setEditingPagoId(null);

    if (viewMode === 'unidades') {
      setShowUnidadForm(true);
      return;
    }

    if (viewMode === 'gastos') {
      setShowGastoForm(true);
      return;
    }

    if (viewMode === 'expensas') {
      setShowExpensaForm(true);
      return;
    }

    if (viewMode === 'pagos') {
      setShowPagoForm(true);
    }
  };

  const closeModuleForm = () => {
    setShowUnidadForm(false);
    setShowGastoForm(false);
    setShowExpensaForm(false);
    setShowPagoForm(false);
  };

  useEffect(() => {
    if (!token || user?.role !== 'owner') {
      return;
    }

    void syncMercadoPagoReturnIfNeeded();
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'owner' || pagos.length === 0) {
      return;
    }

    void syncPendingOwnerOnlinePayments();
  }, [token, user?.role, pagos]);

  useEffect(() => {
    if (!token || user?.role !== 'owner') {
      return;
    }

    const handleFocus = () => {
      void loadAllData('owner');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role === 'owner' || viewMode !== 'configuracion') {
      return;
    }

    if (user?.role === 'admin' && !reporteConsorcioId) {
      return;
    }

    void handleLoadWhatsappHealth();

    if (user?.role === 'admin') {
      void handleLoadConsorcioIntegracion();
    }
  }, [token, user?.role, viewMode, reporteConsorcioId]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          py: 5,
          background:
            'radial-gradient(circle at top left, rgba(0,95,115,0.14), transparent 28%), linear-gradient(180deg, #f2f7f4 0%, #eef4f1 100%)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {token && (
                <IconButton
                  sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="abrir menú"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.4, fontSize: { xs: '1.9rem', sm: '2.125rem' } }}>Gestión de Consorcios</Typography>
                {token && (
                  <Typography variant="body2" color="text.secondary">
                    Sección activa: {viewTitle}
                  </Typography>
                )}
              </Box>
            </Stack>
            {token && <Button variant="outlined" onClick={resetSession}>Cerrar sesión</Button>}
          </Box>

          {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}

          {!token ? (
            <Card sx={{ maxWidth: 420, mx: 'auto', borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Iniciar sesión
                </Typography>
                <Box component="form" onSubmit={handleLogin}>
                  <Stack spacing={2}>
                    <TextField fullWidth value={email} onChange={(event) => setEmail(event.target.value)} label="Email" />
                    <TextField
                      fullWidth
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      label="Contraseña"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={!email.trim() || !password.trim()}
                    >
                      Ingresar
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '320px minmax(0, 1fr)' },
                gap: { xs: 2, lg: 3 },
                alignItems: 'start',
              }}
            >
              <Drawer
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                sx={{ display: { xs: 'block', lg: 'none' } }}
              >
                <Box sx={{ width: 320, p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Menú</Typography>
                    <IconButton onClick={() => setMobileMenuOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                  <Stack spacing={1.2}>
                    {navItems
                      .filter((item) => item.visible)
                      .map((item) => (
                        <Button
                          key={`mobile-${item.key}`}
                          fullWidth
                          startIcon={navIconByView[item.key]}
                          variant={viewMode === item.key ? 'contained' : 'outlined'}
                          onClick={() => {
                            selectView(item.key);
                            setMobileMenuOpen(false);
                          }}
                          sx={{ justifyContent: 'flex-start', py: 1.2, textTransform: 'none' }}
                        >
                          {item.title}
                        </Button>
                      ))}
                  </Stack>
                </Box>
              </Drawer>

              <Card
                sx={{
                  borderRadius: 4,
                  position: { lg: 'sticky' },
                  top: { lg: 24 },
                  border: '1px solid #d6e5df',
                  background: 'linear-gradient(180deg, #f6fbf8 0%, #edf5f1 100%)',
                  display: { xs: 'none', lg: 'block' },
                }}
              >
                <CardContent>
                  <Stack spacing={2.2}>
                    <Box>
                      <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.1 }}>
                        Navegación
                      </Typography>
                      <Typography variant="h6">Panel principal</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Secciones separadas para operar con más claridad.
                      </Typography>
                    </Box>

                    <Stack spacing={1.2}>
                      {navItems
                        .filter((item) => item.visible)
                        .map((item) => (
                          <Button
                            key={item.key}
                            fullWidth
                            startIcon={navIconByView[item.key]}
                            variant={viewMode === item.key ? 'contained' : 'outlined'}
                            onClick={() => selectView(item.key)}
                            sx={{
                              justifyContent: 'space-between',
                              py: 1.3,
                              textTransform: 'none',
                              borderRadius: 2,
                            }}
                          >
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {item.title}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                {item.subtitle}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              {item.meta}
                            </Typography>
                          </Button>
                        ))}
                    </Stack>

                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#eef6f3' }}>
                      <Typography variant="caption" color="text.secondary">
                        Vista actual
                      </Typography>
                      <Typography variant="body2">{viewTitle}</Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#e7f2ee' }}>
                      <Typography variant="caption" color="text.secondary">
                        Sesión activa
                      </Typography>
                      <Typography variant="body2">
                        {user?.name ?? 'Usuario'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user ? roleLabels[user.role] : 'Sin rol'}
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>

              <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2.5, backgroundColor: '#e9f3ef', border: '1px solid #d5e6df' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {navIconByView[viewMode]}
                    <Typography variant="body2">Panel / {viewTitle}</Typography>
                  </Stack>
                  <Chip label={user ? roleLabels[user.role] : 'Sin rol'} size="small" />
                </Stack>
              </Paper>

              {user?.role === 'admin' && viewMode === 'admin' && (
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 12px 28px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.1 }}>
                            Administración
                          </Typography>
                          <Typography variant="h6">Crear edificio / consorcio</Typography>
                          <Typography color="text.secondary">
                            Primero crea el consorcio para luego asociar managers y unidades sobre ese edificio.
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                            gap: 2,
                          }}
                        >
                          <TextField
                            label="Nombre del consorcio"
                            value={consorcioForm.nombre}
                            onChange={(event) => setConsorcioForm((current) => ({ ...current, nombre: event.target.value }))}
                          />
                          <TextField
                            label="Dirección"
                            value={consorcioForm.direccion}
                            onChange={(event) => setConsorcioForm((current) => ({ ...current, direccion: event.target.value }))}
                          />
                        </Box>

                        <Box>
                          <Button
                            variant="contained"
                            onClick={handleCreateConsorcio}
                            disabled={
                              isSubmitting ||
                              !consorcioForm.nombre.trim() ||
                              !consorcioForm.direccion.trim()
                            }
                          >
                            Crear consorcio
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 12px 28px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                          <Box>
                            <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.1 }}>
                              Administración
                            </Typography>
                            <Typography variant="h6">Gestión de managers</Typography>
                            <Typography color="text.secondary">
                              Administra alta, edición y baja de managers en una sola grilla.
                            </Typography>
                          </Box>
                          <Button variant="contained" onClick={handleOpenCreateManager} disabled={isSubmitting || consorcios.length === 0}>
                            Nuevo
                          </Button>
                        </Stack>

                        {managers.length === 0 ? (
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f6f7f8' }}>
                            <Typography color="text.secondary">
                              Aún no hay managers cargados.
                            </Typography>
                          </Paper>
                        ) : (
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                  <TableCell>Nombre</TableCell>
                                  <TableCell>Email</TableCell>
                                  <TableCell>WhatsApp</TableCell>
                                  <TableCell>Password</TableCell>
                                  <TableCell>Consorcio asignado</TableCell>
                                  <TableCell>Acciones</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {managers.map((manager) => (
                                  <TableRow key={manager.id}>
                                    <TableCell>{manager.name}</TableCell>
                                    <TableCell>{manager.email}</TableCell>
                                    <TableCell>{manager.phoneNumber || 'No informado'}</TableCell>
                                    <TableCell>*****</TableCell>
                                    <TableCell>
                                      {consorcios.find((c) => c.id === manager.consorcioId)?.nombre ?? 'Sin asignar'}
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={1}>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleOpenEditManager(manager)}
                                          disabled={isSubmitting}
                                        >
                                          Editar
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          onClick={() => setManagerToDelete(manager)}
                                          disabled={isSubmitting}
                                        >
                                          Eliminar
                                        </Button>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 12px 28px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                          <Box>
                          <Typography variant="h6">Propietarios creados</Typography>
                          <Typography color="text.secondary">
                            Estos propietarios estarán disponibles para asociar unidades.
                          </Typography>
                          </Box>
                          <Button variant="contained" onClick={handleOpenCreateOwner} disabled={isSubmitting}>
                            Nuevo
                          </Button>
                        </Stack>

                        {owners.length === 0 ? (
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f6f7f8' }}>
                            <Typography color="text.secondary">Aún no hay propietarios cargados.</Typography>
                          </Paper>
                        ) : (
                          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 640 }}>
                              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                  <TableCell>Nombre</TableCell>
                                  <TableCell>Email</TableCell>
                                  <TableCell>WhatsApp</TableCell>
                                  <TableCell>Password</TableCell>
                                  <TableCell>Unidad asignada</TableCell>
                                  <TableCell>Acciones</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {owners.map((owner) => {
                                  const assignedUnidad = unidades.find(
                                    (unidad) => unidad.propietarioId === owner.id,
                                  );

                                  return (
                                    <TableRow key={owner.id}>
                                      <TableCell>{owner.name}</TableCell>
                                      <TableCell>{owner.email}</TableCell>
                                      <TableCell>{owner.phoneNumber || 'No informado'}</TableCell>
                                      <TableCell>*****</TableCell>
                                      <TableCell>
                                        {assignedUnidad
                                          ? `${assignedUnidad.numero} - ${consorcios.find((c) => c.id === assignedUnidad.consorcioId)?.nombre ?? 'Sin consorcio'}`
                                          : 'Sin asignar'}
                                      </TableCell>
                                      <TableCell>
                                        <Stack direction="row" spacing={1}>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleStartEditOwner(owner)}
                                            disabled={isSubmitting}
                                          >
                                            Editar
                                          </Button>
                                          <Button
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteOwner(owner)}
                                            disabled={isSubmitting}
                                          >
                                            Eliminar
                                          </Button>
                                        </Stack>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              )}

              <Alert severity="info" sx={{ borderRadius: 3 }}>
                <strong>Rol actual:</strong> {user ? roleLabels[user.role] : 'Sin rol'}. Ahora la generación de expensas liquida por <strong>unidad</strong> y permite criterio por <strong>coeficiente</strong> o <strong>m2</strong>.
              </Alert>

              <Fade
                in={viewMode === 'unidades' || viewMode === 'gastos' || viewMode === 'expensas' || viewMode === 'pagos'}
                mountOnEnter
                unmountOnExit
                timeout={220}
              >
                <Box
                  sx={{
                    display: 'block',
                  }}
                >
                <Card sx={{ borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 14px 34px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                          Módulo operativo
                        </Typography>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                          {viewTitle}
                        </Typography>
                      </Box>

                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#eef6f3' }}>
                        <Typography variant="body2" color="text.secondary">
                          Módulo activo: <strong>{viewTitle}</strong>
                        </Typography>
                      </Paper>

                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, backgroundColor: '#fbfcfb' }}>
                        <Stack spacing={2.5}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                            <Box>
                              <Typography variant="h6">{currentAction.title}</Typography>
                              <Typography color="text.secondary">{currentAction.description}</Typography>
                            </Box>
                            {moduleButtonLabelByView[viewMode] && (
                              <Button variant="contained" onClick={openModuleForm}>
                                {moduleButtonLabelByView[viewMode]}
                              </Button>
                            )}
                          </Stack>

                          {currentStep === 2 && (
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#eef6f3' }}>
                              <Typography variant="caption" color="text.secondary">
                                Total de gastos acumulado ({expensaForm.periodo})
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {formatMoney(totalGastosPeriodo)}
                              </Typography>
                            </Paper>
                          )}

                          {currentStep === 3 && expensaForm.criterioProrrateo === 'm2' && unidadesSinM2 > 0 && (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                              Hay {unidadesSinM2} unidades sin m2 cargados. Completa ese dato para poder liquidar por metros cuadrados.
                            </Alert>
                          )}

                          {selectedDetalleExpensa && viewMode === 'expensas' && (
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f2f6ff' }}>
                              <Typography variant="subtitle2">Detalle de expensa para PDF</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Unidad {selectedDetalleExpensa.expensa.unidadNumero ?? 'N/D'} | Período {selectedDetalleExpensa.expensa.periodo}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Gastos incluidos: {selectedDetalleExpensa.resumen.cantidadGastos} | PDF: {selectedDetalleExpensa.resumen.pdfUrl}
                              </Typography>
                            </Paper>
                          )}

                          {renderModuleGrid()}

                          {viewMode === 'expensas' && (
                            <Button variant="outlined" onClick={handleVerDetalleExpensa} disabled={isSubmitting || !unidadId} sx={{ alignSelf: 'flex-start' }}>
                              Ver detalle PDF de unidad seleccionada
                            </Button>
                          )}
                        </Stack>
                      </Paper>
                    </Stack>
                  </CardContent>
                </Card>

                </Box>
              </Fade>

              <Dialog
                open={isModuleFormVisible}
                onClose={closeModuleForm}
                fullWidth
                maxWidth="md"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  {currentAction.title}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography color="text.secondary">{currentAction.description}</Typography>
                    {validationMessages.length > 0 && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        {validationMessages[0]}
                      </Alert>
                    )}
                    {renderStepForm()}
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={closeModuleForm}>Cancelar</Button>
                  {viewMode === 'unidades' && (
                    <Button variant="outlined" onClick={handleCreateUnidadAndStay} disabled={currentAction.disabled || isSubmitting}>
                      Guardar y crear otra
                    </Button>
                  )}
                  {viewMode === 'gastos' && (
                    <Button variant="outlined" onClick={handleCreateGastoAndStay} disabled={currentAction.disabled || isSubmitting}>
                      Guardar y cargar otro
                    </Button>
                  )}
                  <Button variant="contained" onClick={currentAction.action} disabled={currentAction.disabled || isSubmitting}>
                    {currentAction.buttonLabel}
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={Boolean(editingUnidadId)}
                onClose={() => setEditingUnidadId(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  Editar unidad
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      label="Número"
                      value={unidadEditForm.numero}
                      onChange={(event) =>
                        setUnidadEditForm((current) => ({ ...current, numero: event.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Coeficiente"
                      type="number"
                      inputProps={{ min: 0, max: 1, step: 0.01 }}
                      value={unidadEditForm.coeficiente}
                      onChange={(event) =>
                        setUnidadEditForm((current) => ({ ...current, coeficiente: event.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Metros cuadrados"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={unidadEditForm.metrosCuadrados}
                      onChange={(event) =>
                        setUnidadEditForm((current) => ({ ...current, metrosCuadrados: event.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      select
                      label="Propietario"
                      value={unidadEditForm.propietarioId}
                      onChange={(event) =>
                        setUnidadEditForm((current) => ({ ...current, propietarioId: event.target.value }))
                      }
                      fullWidth
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {owners.map((owner) => (
                        <MenuItem key={owner.id} value={owner.id}>
                          {owner.name} ({owner.email})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={() => setEditingUnidadId(null)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveUnidad}
                    disabled={!unidadEditForm.numero.trim() || Number(unidadEditForm.coeficiente) <= 0 || Number.isNaN(Number(unidadEditForm.coeficiente))}
                  >
                    Guardar cambios
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={Boolean(editingGastoId)}
                onClose={() => setEditingGastoId(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  Editar gasto
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      label="Descripción"
                      value={gastoEditForm.descripcion}
                      onChange={(event) => setGastoEditForm((current) => ({ ...current, descripcion: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Monto"
                      type="number"
                      inputProps={{ min: 0.01, step: 0.01 }}
                      value={gastoEditForm.monto}
                      onChange={(event) => setGastoEditForm((current) => ({ ...current, monto: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Fecha"
                      type="date"
                      value={gastoEditForm.fecha}
                      onChange={(event) => setGastoEditForm((current) => ({ ...current, fecha: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={() => setEditingGastoId(null)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveGasto}
                    disabled={
                      !gastoEditForm.descripcion.trim() ||
                      Number.isNaN(Number(gastoEditForm.monto)) ||
                      Number(gastoEditForm.monto) <= 0 ||
                      !gastoEditForm.fecha
                    }
                  >
                    Guardar cambios
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={Boolean(editingPagoId)}
                onClose={() => setEditingPagoId(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  Editar pago
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      label="Monto"
                      type="number"
                      inputProps={{ min: 0.01, step: 0.01 }}
                      value={pagoEditForm.monto}
                      onChange={(event) => setPagoEditForm((current) => ({ ...current, monto: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      select
                      label="Estado"
                      value={pagoEditForm.estado}
                      onChange={(event) => setPagoEditForm((current) => ({ ...current, estado: event.target.value }))}
                      fullWidth
                    >
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="aprobado">Aprobado</MenuItem>
                      <MenuItem value="rechazado">Rechazado</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="Método"
                      value={pagoEditForm.metodo}
                      onChange={(event) => setPagoEditForm((current) => ({ ...current, metodo: event.target.value as 'manual' | 'online' }))}
                      fullWidth
                    >
                      <MenuItem value="manual">Manual</MenuItem>
                      <MenuItem value="online">Online</MenuItem>
                    </TextField>
                    <TextField
                      label="Referencia"
                      value={pagoEditForm.referencia}
                      onChange={(event) => setPagoEditForm((current) => ({ ...current, referencia: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Observación"
                      value={pagoEditForm.observacion}
                      onChange={(event) => setPagoEditForm((current) => ({ ...current, observacion: event.target.value }))}
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Opcional: detalle de revisión, comentario o motivo"
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={() => setEditingPagoId(null)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleSavePago}
                    disabled={Number.isNaN(Number(pagoEditForm.monto)) || Number(pagoEditForm.monto) <= 0 || !pagoEditForm.estado}
                  >
                    Guardar cambios
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={Boolean(manualPaymentExpensa)}
                onClose={() => {
                  setManualPaymentExpensa(null);
                  setManualComprobanteFile(null);
                }}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  Registrar pago manual
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography color="text.secondary">
                      Adjunta el comprobante PDF para que el manager pueda revisarlo y aprobar el pago pendiente.
                    </Typography>
                    <TextField
                      type="file"
                      inputProps={{ accept: 'application/pdf' }}
                      onChange={(event) => {
                        const selected = (event.target as HTMLInputElement).files?.[0] ?? null;
                        setManualComprobanteFile(selected);
                      }}
                      fullWidth
                    />
                    <Typography variant="caption" color="text.secondary">
                      Expensa: {manualPaymentExpensa?.periodo ?? 'N/D'} | Total: {manualPaymentExpensa ? formatMoney(manualPaymentExpensa.total) : '-'}
                    </Typography>
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={() => { setManualPaymentExpensa(null); setManualComprobanteFile(null); }}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (manualPaymentExpensa) {
                        handlePagarExpensa(manualPaymentExpensa, 'manual');
                      }
                    }}
                    disabled={!manualComprobanteFile || isSubmitting}
                  >
                    Registrar pago manual
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={ownerModalOpen}
                onClose={() => {
                  setOwnerModalOpen(false);
                  setEditingOwnerId(null);
                }}
                fullWidth
                maxWidth="md"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  {editingOwnerId ? 'Editar propietario' : 'Nuevo propietario'}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      label="Nombre"
                      value={ownerEditForm.name}
                      onChange={(event) => setOwnerEditForm((current) => ({ ...current, name: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={ownerEditForm.email}
                      onChange={(event) => setOwnerEditForm((current) => ({ ...current, email: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="WhatsApp (opcional)"
                      value={ownerEditForm.phoneNumber}
                      onChange={(event) => setOwnerEditForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                      fullWidth
                      helperText="Ejemplo: +5491122334455"
                    />
                    <TextField
                      label={editingOwnerId ? 'Contraseña (opcional)' : 'Contraseña'}
                      type="password"
                      value={ownerEditForm.password}
                      onChange={(event) => setOwnerEditForm((current) => ({ ...current, password: event.target.value }))}
                      fullWidth
                      helperText={editingOwnerId ? 'Déjalo vacío para mantener la contraseña actual' : 'Mínimo 6 caracteres'}
                    />
                    <TextField
                      select
                      label="Unidad asignada"
                      value={ownerEditForm.unidadId}
                      onChange={(event) => setOwnerEditForm((current) => ({ ...current, unidadId: event.target.value }))}
                      fullWidth
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {unidades
                        .filter(
                          (unidad) =>
                            !unidad.propietarioId ||
                            (editingOwnerId ? unidad.propietarioId === editingOwnerId : false),
                        )
                        .map((unidad) => (
                          <MenuItem key={unidad.id} value={unidad.id}>
                            {unidad.numero} - {consorcios.find((c) => c.id === unidad.consorcioId)?.nombre ?? unidad.consorcioId.slice(0, 8)}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button
                    onClick={() => {
                      setOwnerModalOpen(false);
                      setEditingOwnerId(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveOwner}
                    disabled={
                      !ownerEditForm.name.trim() ||
                      !ownerEditForm.email.trim() ||
                      (!editingOwnerId && ownerEditForm.password.length < 6) ||
                      (Boolean(editingOwnerId) && ownerEditForm.password.length > 0 && ownerEditForm.password.length < 6)
                    }
                  >
                    Guardar cambios
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={managerModalOpen}
                onClose={() => setManagerModalOpen(false)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                    boxShadow: '0 18px 44px rgba(0, 95, 115, 0.22)',
                    overflow: 'hidden',
                  },
                }}
              >
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  {editingManagerId ? 'Editar manager' : 'Nuevo manager'}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      label="Nombre"
                      value={managerForm.name}
                      onChange={(event) => setManagerForm((current) => ({ ...current, name: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={managerForm.email}
                      onChange={(event) => setManagerForm((current) => ({ ...current, email: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="WhatsApp (opcional)"
                      value={managerForm.phoneNumber}
                      onChange={(event) => setManagerForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                      fullWidth
                      helperText="Ejemplo: +5491122334455"
                    />
                    <TextField
                      label="Contraseña (opcional)"
                      type="password"
                      value={managerForm.password}
                      onChange={(event) => setManagerForm((current) => ({ ...current, password: event.target.value }))}
                      fullWidth
                      helperText={editingManagerId ? 'Déjala vacía para mantener la contraseña actual' : 'Mínimo 6 caracteres'}
                    />
                    <TextField
                      select
                      label="Consorcio asignado"
                      value={managerForm.consorcioId}
                      onChange={(event) => setManagerForm((current) => ({ ...current, consorcioId: event.target.value }))}
                      fullWidth
                    >
                      {consorcios.map((consorcio) => (
                        <MenuItem key={consorcio.id} value={consorcio.id}>
                          {consorcio.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={() => setManagerModalOpen(false)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveManager}
                    disabled={
                      !managerForm.name.trim() ||
                      !managerForm.email.trim() ||
                      !managerForm.consorcioId ||
                      (!editingManagerId && managerForm.password.length < 6) ||
                      (Boolean(editingManagerId) && managerForm.password.length > 0 && managerForm.password.length < 6)
                    }
                  >
                    Guardar cambios
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={Boolean(managerToDelete)}
                onClose={() => setManagerToDelete(null)}
                fullWidth
                maxWidth="xs"
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    border: '1px solid #7fb3a4',
                  },
                }}
              >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                  <Typography color="text.secondary">
                    ¿Seguro que deseas eliminar al manager {managerToDelete?.name}? Esta acción no se puede deshacer.
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setManagerToDelete(null)}>Cancelar</Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => {
                      if (managerToDelete) {
                        void handleDeleteManager(managerToDelete);
                        setManagerToDelete(null);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </DialogActions>
              </Dialog>

              <Fade in={viewMode === 'propietario'} mountOnEnter unmountOnExit timeout={220}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                          Portal Propietario
                        </Typography>
                        <Typography variant="h5">Mi expensa del mes y pagos</Typography>
                        <Typography color="text.secondary">
                          Aquí el propietario visualiza sus expensas por período, ve el detalle para PDF y puede pagar online o reportar pago manual.
                        </Typography>
                      </Box>

                      {ownerPaymentReceipt && (
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                          Pago registrado correctamente: {formatMoney(ownerPaymentReceipt.monto)} por método {ownerPaymentReceipt.metodo === 'online' ? 'online' : 'manual'}.
                          Estado actual: {ownerPaymentReceipt.estado}. Fecha: {new Date(ownerPaymentReceipt.fecha).toLocaleDateString('es-AR')}.
                          {ownerPaymentReceipt.referencia && (
                            <>
                              {' '}Referencia MP: <strong>{ownerPaymentReceipt.referencia}</strong>.
                            </>
                          )}
                          {ownerPaymentReceipt.comprobanteUrl && (
                            <>
                              {' '}
                              <Button
                                size="small"
                                onClick={() => handleOpenComprobante(ownerPaymentReceipt.comprobanteUrl)}
                              >
                                Ver comprobante
                              </Button>
                            </>
                          )}
                        </Alert>
                      )}

                      {expensas.length === 0 ? (
                        <Alert severity="info">No tienes expensas disponibles todavía.</Alert>
                      ) : (
                        <>
                          <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                            {expensas.map((expensa) => (
                              <Paper key={`owner-expensa-card-${expensa.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                <Stack spacing={1}>
                                  <Typography variant="subtitle2">Período {expensa.periodo}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Unidad: {expensa.unidadNumero ?? expensa.unidadId?.slice(0, 8) ?? 'N/D'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    Total: {formatMoney(expensa.total)}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Button size="small" onClick={() => handleOpenExpensaPdf(expensa.id)}>
                                      Ver PDF
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disabled={isSubmitting}
                                      onClick={() => handlePagarOnlineMercadoPago(expensa)}
                                    >
                                      Pagar online
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={isSubmitting}
                                      onClick={() => {
                                        setManualPaymentExpensa(expensa);
                                        setManualComprobanteFile(null);
                                      }}
                                    >
                                      Manual
                                    </Button>
                                  </Stack>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>

                          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Table size="small">
                              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                  <TableCell>Período</TableCell>
                                  <TableCell>Unidad</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                  <TableCell>Detalle</TableCell>
                                  <TableCell>Acciones</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {expensas.map((expensa) => (
                                  <TableRow key={expensa.id}>
                                    <TableCell>{expensa.periodo}</TableCell>
                                    <TableCell>{expensa.unidadNumero ?? expensa.unidadId?.slice(0, 8) ?? 'N/D'}</TableCell>
                                    <TableCell align="right">{formatMoney(expensa.total)}</TableCell>
                                    <TableCell>
                                      <Button
                                        size="small"
                                        onClick={() => handleOpenExpensaPdf(expensa.id)}
                                      >
                                        Ver detalle PDF
                                      </Button>
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          disabled={isSubmitting}
                                          onClick={() => handlePagarOnlineMercadoPago(expensa)}
                                        >
                                          Pagar online
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={isSubmitting}
                                          onClick={() => {
                                            setManualPaymentExpensa(expensa);
                                            setManualComprobanteFile(null);
                                          }}
                                        >
                                          Registrar manual
                                        </Button>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}

                      <Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>Mis últimos pagos</Typography>
                        {latestOwnerPayments.length === 0 ? (
                          <Alert severity="info">Aún no registraste pagos.</Alert>
                        ) : (
                          <>
                            <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                              {latestOwnerPayments.map((pago) => (
                                <Paper key={`owner-payment-card-${pago.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                  <Stack spacing={0.6}>
                                    <Typography variant="body2">
                                      {new Date(pago.fecha).toLocaleDateString('es-AR')} - {formatMoney(pago.monto)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Estado: {pago.estado} | Método: {pago.metodo}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Referencia: {pago.referencia ?? '-'}
                                    </Typography>
                                    {pago.comprobanteUrl && (
                                      <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => handleOpenComprobante(pago.comprobanteUrl)}>
                                        Ver comprobante
                                      </Button>
                                    )}
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>

                            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
                              <Table size="small" sx={{ minWidth: 640 }}>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell align="right">Monto</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Método</TableCell>
                                    <TableCell>Referencia</TableCell>
                                    <TableCell>Comprobante</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {latestOwnerPayments.map((pago) => (
                                    <TableRow key={`owner-pago-${pago.id}`}>
                                      <TableCell>{new Date(pago.fecha).toLocaleDateString('es-AR')}</TableCell>
                                      <TableCell align="right">{formatMoney(pago.monto)}</TableCell>
                                      <TableCell>{pago.estado}</TableCell>
                                      <TableCell>{pago.metodo}</TableCell>
                                      <TableCell>{pago.referencia ?? '-'}</TableCell>
                                      <TableCell>
                                        {pago.comprobanteUrl ? (
                                          <Button size="small" onClick={() => handleOpenComprobante(pago.comprobanteUrl)}>Ver comprobante</Button>
                                        ) : (
                                          '-'
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>

              <Fade in={viewMode === 'reportes'} mountOnEnter unmountOnExit timeout={220}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                          Reportes
                        </Typography>
                        <Typography variant="h5">Resumen mensual del consorcio</Typography>
                        <Typography color="text.secondary">
                          Consulta totales de gastos, expensas emitidas y pagos registrados por período.
                        </Typography>
                      </Box>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        {user?.role === 'admin' && (
                          <TextField
                            select
                            label="Consorcio"
                            value={reporteConsorcioId}
                            onChange={(event) => setReporteConsorcioId(event.target.value)}
                            fullWidth
                          >
                            {consorcios.map((consorcio) => (
                              <MenuItem key={consorcio.id} value={consorcio.id}>
                                {consorcio.nombre}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}

                        <TextField
                          label="Período"
                          type="month"
                          value={reportePeriodo}
                          onChange={(event) => setReportePeriodo(event.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />

                        <Button
                          variant="contained"
                          onClick={handleLoadReporte}
                          disabled={reporteLoading || !reportePeriodo || (user?.role === 'admin' && !reporteConsorcioId)}
                        >
                          {reporteLoading ? 'Consultando...' : 'Consultar'}
                        </Button>
                      </Stack>

                      {reporteResumen ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">Gastos</Typography>
                            <Typography variant="h6">{formatMoney(reporteResumen.totalGastos)}</Typography>
                          </Paper>
                          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">Expensas emitidas</Typography>
                            <Typography variant="h6">{formatMoney(reporteResumen.totalExpensas)}</Typography>
                          </Paper>
                          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">Pagos registrados</Typography>
                            <Typography variant="h6">{formatMoney(reporteResumen.totalPagos)}</Typography>
                          </Paper>
                          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">Saldo ({reporteResumen.periodo})</Typography>
                            <Typography variant="h6">{formatMoney(reporteResumen.totalExpensas - reporteResumen.totalPagos)}</Typography>
                          </Paper>
                        </Box>
                      ) : (
                        <Alert severity="info">Selecciona período y consulta para ver el resumen.</Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>

              <Fade in={viewMode === 'configuracion'} mountOnEnter unmountOnExit timeout={220}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                          Configuración
                        </Typography>
                        <Typography variant="h5">Integraciones, WhatsApp y notificaciones</Typography>
                        <Typography color="text.secondary">
                          Gestiona claves por consorcio y valida envíos desde un panel administrativo.
                        </Typography>
                      </Box>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                          select
                          label="Consorcio"
                          value={reporteConsorcioId}
                          onChange={(event) => setReporteConsorcioId(event.target.value)}
                          fullWidth
                        >
                          {consorcios.map((consorcio) => (
                            <MenuItem key={consorcio.id} value={consorcio.id}>
                              {consorcio.nombre}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          label="Período"
                          type="month"
                          value={reportePeriodo}
                          onChange={(event) => setReportePeriodo(event.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />

                        <Button
                          variant="outlined"
                          onClick={handleSendPendingReminders}
                          disabled={recordatorioLoading || !reportePeriodo || !reporteConsorcioId}
                        >
                          {recordatorioLoading ? 'Enviando...' : 'Recordar pendientes'}
                        </Button>
                      </Stack>

                      {recordatorioResultado && (
                        <Alert severity="success">
                          Se generaron {recordatorioResultado.recordatoriosGenerados} recordatorios de pago ({recordatorioResultado.periodo}) por {recordatorioResultado.proveedor}.
                        </Alert>
                      )}

                      <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #d8e6df', backgroundColor: '#f9fcfb' }}>
                        <Stack spacing={1.2}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
                            <Box>
                              <Typography variant="subtitle1">Integraciones por consorcio</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Permite usar claves propias por edificio y mantener fallback demo global.
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleLoadConsorcioIntegracion}
                              disabled={integracionLoading || !reporteConsorcioId}
                            >
                              {integracionLoading ? 'Cargando...' : 'Recargar configuración'}
                            </Button>
                          </Stack>

                          {!reporteConsorcioId ? (
                            <Alert severity="info">Selecciona un consorcio para editar sus integraciones.</Alert>
                          ) : (
                            <>
                              {integracionMeta && (
                                <Alert severity={integracionMeta.source === 'consorcio' ? 'success' : 'warning'}>
                                  Fuente activa: {integracionMeta.source === 'consorcio' ? 'configuración propia del consorcio' : 'fallback global demo'}.
                                  {integracionMeta.updatedAt ? ` Última actualización: ${new Date(integracionMeta.updatedAt).toLocaleString('es-AR')}.` : ''}
                                </Alert>
                              )}

                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                                <TextField
                                  select
                                  label="Modo"
                                  value={integracionForm.mode}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    mode: event.target.value as 'demo' | 'production',
                                  }))}
                                  fullWidth
                                >
                                  <MenuItem value="demo">Demo</MenuItem>
                                  <MenuItem value="production">Producción</MenuItem>
                                </TextField>

                                <TextField
                                  select
                                  label="Estado"
                                  value={integracionForm.active ? 'active' : 'inactive'}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    active: event.target.value === 'active',
                                  }))}
                                  fullWidth
                                >
                                  <MenuItem value="active">Activa</MenuItem>
                                  <MenuItem value="inactive">Inactiva</MenuItem>
                                </TextField>

                                <TextField
                                  label="Proveedor WhatsApp"
                                  value={integracionForm.whatsappProvider}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    whatsappProvider: event.target.value,
                                  }))}
                                  fullWidth
                                />
                              </Stack>

                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                                <TextField
                                  label="MP Access Token (opcional)"
                                  type="password"
                                  value={integracionForm.mercadoPagoAccessToken}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    mercadoPagoAccessToken: event.target.value,
                                  }))}
                                  helperText={integracionMeta?.maskedMercadoPagoAccessToken ? `Actual: ${integracionMeta.maskedMercadoPagoAccessToken}` : 'Si lo dejas vacío, usa fallback global.'}
                                  fullWidth
                                />

                                <TextField
                                  label="MP Test Payer Email"
                                  value={integracionForm.mercadoPagoTestPayerEmail}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    mercadoPagoTestPayerEmail: event.target.value,
                                  }))}
                                  fullWidth
                                />
                              </Stack>

                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                                <TextField
                                  label="WhatsApp Meta Token (opcional)"
                                  type="password"
                                  value={integracionForm.whatsappMetaToken}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    whatsappMetaToken: event.target.value,
                                  }))}
                                  helperText={integracionMeta?.maskedWhatsappMetaToken ? `Actual: ${integracionMeta.maskedWhatsappMetaToken}` : 'Si lo dejas vacío, usa fallback global.'}
                                  fullWidth
                                />

                                <TextField
                                  label="WhatsApp Phone Number ID"
                                  value={integracionForm.whatsappMetaPhoneNumberId}
                                  onChange={(event) => setIntegracionForm((current) => ({
                                    ...current,
                                    whatsappMetaPhoneNumberId: event.target.value,
                                  }))}
                                  fullWidth
                                />

                                <Button
                                  variant="contained"
                                  onClick={handleSaveConsorcioIntegracion}
                                  disabled={integracionSaving || !reporteConsorcioId}
                                >
                                  {integracionSaving ? 'Guardando...' : 'Guardar claves'}
                                </Button>
                              </Stack>
                            </>
                          )}
                        </Stack>
                      </Paper>

                      <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #d8e6df', backgroundColor: '#f9fcfb' }}>
                        <Stack spacing={1.2}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
                            <Box>
                              <Typography variant="subtitle1">Conexión WhatsApp</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Verifica proveedor, credenciales y número activo sin salir del panel.
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleLoadWhatsappHealth}
                              disabled={whatsappHealthLoading || !reporteConsorcioId}
                            >
                              {whatsappHealthLoading ? 'Verificando...' : 'Verificar conexión'}
                            </Button>
                          </Stack>

                          {!whatsappHealth ? (
                            <Alert severity="info">Aún no se consultó el estado de WhatsApp.</Alert>
                          ) : (
                            <Stack spacing={0.6}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Estado: {whatsappHealth.ready ? 'Listo para enviar' : 'No listo'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Proveedor: {whatsappHealth.provider} | Modo: {whatsappHealth.mode ?? 'demo'} | Estado técnico: {whatsappHealth.status}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Detalle: {whatsappHealth.detail}
                              </Typography>
                              {whatsappHealth.account && (
                                <Typography variant="caption" color="text.secondary">
                                  Número: {whatsappHealth.account.displayPhoneNumber ?? 'N/D'} | Phone Number ID: {whatsappHealth.account.phoneNumberId}
                                  {whatsappHealth.account.verifiedName ? ` | Nombre verificado: ${whatsappHealth.account.verifiedName}` : ''}
                                </Typography>
                              )}
                            </Stack>
                          )}
                        </Stack>
                      </Paper>

                      <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #d8e6df', backgroundColor: '#f9fcfb' }}>
                        <Stack spacing={1.2}>
                          <Box>
                            <Typography variant="subtitle1">Probar envío de WhatsApp</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Envia un mensaje manual para validar número, token y salida real sin depender de pendientes.
                            </Typography>
                          </Box>

                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                            <TextField
                              label="Teléfono destino"
                              placeholder="Ej: 5493886406928"
                              value={whatsappTestPhone}
                              onChange={(event) => setWhatsappTestPhone(event.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Mensaje (opcional)"
                              placeholder="Prueba de WhatsApp desde el panel"
                              value={whatsappTestMessage}
                              onChange={(event) => setWhatsappTestMessage(event.target.value)}
                              fullWidth
                            />
                            <Button
                              variant="contained"
                              onClick={handleSendWhatsappTest}
                              disabled={whatsappTestLoading || !whatsappTestPhone.trim()}
                            >
                              {whatsappTestLoading ? 'Enviando...' : 'Enviar prueba'}
                            </Button>
                          </Stack>

                          {whatsappTestResult && (
                            <Alert severity={whatsappTestResult.ok ? 'success' : 'warning'}>
                              Resultado: {whatsappTestResult.estado} | Proveedor: {whatsappTestResult.proveedor}
                              {whatsappTestResult.detalle ? ` | Detalle: ${whatsappTestResult.detalle}` : ''}
                            </Alert>
                          )}
                        </Stack>
                      </Paper>

                      <Paper sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #d8e6df', backgroundColor: '#f9fcfb' }}>
                        <Stack spacing={1.2}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
                            <Box>
                              <Typography variant="subtitle1">Historial de notificaciones</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Visible para administración. Muestra envíos, omitidos y errores.
                              </Typography>
                            </Box>
                            <Button variant="outlined" size="small" onClick={handleLoadNotificationHistory} disabled={historialLoading}>
                              {historialLoading ? 'Actualizando...' : 'Actualizar historial'}
                            </Button>
                          </Stack>

                          {notificacionesHistorial.length === 0 ? (
                            <Alert severity="info">No hay notificaciones registradas para este filtro.</Alert>
                          ) : (
                            <Stack spacing={1}>
                              {notificacionesHistorial.map((item) => (
                                <Paper key={item.id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                                  <Stack spacing={0.4}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {getNotificationTypeLabel(item)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(item.createdAt).toLocaleString('es-AR')}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">
                                      Destino: {item.destinatarioNombre ?? item.destinatarioEmail ?? 'Sin destinatario'}
                                      {item.destinatarioTelefono ? ` | ${item.destinatarioTelefono}` : ''}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Estado: {item.estado} | Canal: {item.canal} | Proveedor: {item.proveedor}
                                    </Typography>
                                    <Typography variant="body2">{item.mensaje}</Typography>
                                    {item.detalleEstado && (
                                      <Typography variant="caption" color="text.secondary">
                                        Detalle: {item.detalleEstado}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>

              <Fade in={viewMode === 'data'} mountOnEnter unmountOnExit timeout={220}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: { xs: 'block', md: 'none' }, pb: 1.2 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Sección"
                            value={dataTab}
                            onChange={(event) => setDataTab(event.target.value as DataTab)}
                          >
                            <MenuItem value="consorcios">Consorcios ({consorcios.length})</MenuItem>
                            <MenuItem value="unidades">Unidades ({unidades.length})</MenuItem>
                            <MenuItem value="gastos">Gastos ({gastos.length})</MenuItem>
                            <MenuItem value="expensas">Expensas ({expensas.length})</MenuItem>
                            <MenuItem value="pagos">Pagos ({pagos.length})</MenuItem>
                          </TextField>
                        </Box>

                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Tabs
                            value={dataTab}
                            onChange={(_event, value: DataTab) => setDataTab(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            aria-label="Pestañas de tablas y registros"
                          >
                            <Tab value="consorcios" label={`Consorcios (${consorcios.length})`} />
                            <Tab value="unidades" label={`Unidades (${unidades.length})`} />
                            <Tab value="gastos" label={`Gastos (${gastos.length})`} />
                            <Tab value="expensas" label={`Expensas (${expensas.length})`} />
                            <Tab value="pagos" label={`Pagos (${pagos.length})`} />
                          </Tabs>
                        </Box>
                      </Box>

                      {dataTab === 'consorcios' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Consorcios
                          </Typography>
                          {consorcios.length === 0 ? (
                            <Alert severity="info">No hay consorcios cargados todavía.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {consorcios.map((consorcio) => (
                                  <Paper
                                    key={`consorcio-card-${consorcio.id}`}
                                    elevation={0}
                                    onClick={() => syncSelectedConsorcio(consorcio.id)}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 2,
                                      border: '1px solid #dce9e4',
                                      backgroundColor: consorcio.id === consorcioId ? '#edf7f3' : '#fafcfb',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Typography variant="subtitle2">{consorcio.nombre}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {consorcio.direccion}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ minWidth: 680 }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Nombre</TableCell>
                                      <TableCell>Dirección</TableCell>
                                      <TableCell>ID</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {consorcios.map((consorcio) => (
                                      <TableRow
                                        key={consorcio.id}
                                        onClick={() => syncSelectedConsorcio(consorcio.id)}
                                        sx={{
                                          cursor: 'pointer',
                                          backgroundColor: consorcio.id === consorcioId ? '#e3f2fd' : 'inherit',
                                          '&:hover': { backgroundColor: '#f5f5f5' },
                                        }}
                                      >
                                        <TableCell>{consorcio.nombre}</TableCell>
                                        <TableCell>{consorcio.direccion}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>{consorcio.id.slice(0, 8)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          )}
                        </Box>
                      )}

                      {dataTab === 'unidades' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Unidades
                          </Typography>
                          {unidades.length === 0 ? (
                            <Alert severity="info">No hay unidades cargadas todavía.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {unidades.map((unidad) => (
                                  <Paper
                                    key={`card-${unidad.id}`}
                                    elevation={0}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 2,
                                      border: '1px solid #dce9e4',
                                      backgroundColor: unidad.id === unidadId ? '#edf7f3' : '#fafcfb',
                                    }}
                                  >
                                    <Stack spacing={0.8}>
                                      <Typography variant="subtitle2">Unidad {unidad.numero}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Coef.: {unidad.coeficiente.toFixed(2)} | m2: {unidad.metrosCuadrados == null ? '-' : unidad.metrosCuadrados.toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Propietario: {getPropietarioLabel(unidad.propietarioId)}
                                      </Typography>
                                      <Stack direction="row" spacing={1}>
                                        <Button size="small" onClick={() => { syncSelectedUnidad(unidad.id); handleStartEditUnidad(unidad); }}>
                                          Editar
                                        </Button>
                                        <Button size="small" color="error" onClick={() => handleDeleteUnidad(unidad.id)}>
                                          Eliminar
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ minWidth: 860 }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Número</TableCell>
                                      <TableCell align="right">Coeficiente</TableCell>
                                      <TableCell align="right">m2</TableCell>
                                      <TableCell>Propietario</TableCell>
                                      <TableCell>Acciones</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {unidades.map((unidad) => (
                                      <TableRow
                                        key={unidad.id}
                                        onClick={() => syncSelectedUnidad(unidad.id)}
                                        sx={{
                                          cursor: 'pointer',
                                          backgroundColor: unidad.id === unidadId ? '#e3f2fd' : 'inherit',
                                          '&:hover': { backgroundColor: '#f5f5f5' },
                                        }}
                                      >
                                        <TableCell>{unidad.numero}</TableCell>
                                        <TableCell align="right">{unidad.coeficiente.toFixed(2)}</TableCell>
                                        <TableCell align="right">
                                          {unidad.metrosCuadrados == null ? '-' : unidad.metrosCuadrados.toFixed(2)}
                                        </TableCell>
                                        <TableCell>{getPropietarioLabel(unidad.propietarioId)}</TableCell>
                                        <TableCell>
                                          <Stack direction="row" spacing={1}>
                                            <Button size="small" onClick={() => handleStartEditUnidad(unidad)}>Editar</Button>
                                            <Button size="small" color="error" onClick={() => handleDeleteUnidad(unidad.id)}>Eliminar</Button>
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          )}
                        </Box>
                      )}

                      {dataTab === 'gastos' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Gastos
                          </Typography>
                          {gastos.length === 0 ? (
                            <Alert severity="info">No hay gastos cargados todavía.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {gastos.map((gasto) => (
                                  <Paper key={`gasto-card-${gasto.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Typography variant="subtitle2">{gasto.descripcion}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                      {formatMoney(gasto.monto)}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ minWidth: 520 }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Descripción</TableCell>
                                      <TableCell align="right">Monto</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {gastos.map((gasto) => (
                                      <TableRow key={gasto.id}>
                                        <TableCell>{gasto.descripcion}</TableCell>
                                        <TableCell align="right">{formatMoney(gasto.monto)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          )}
                        </Box>
                      )}

                      {dataTab === 'expensas' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Expensas
                          </Typography>
                          {expensas.length === 0 ? (
                            <Alert severity="info">No hay expensas cargadas todavía.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {expensas.map((expensa) => (
                                  <Paper key={`expensa-card-${expensa.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Stack spacing={0.6}>
                                      <Typography variant="subtitle2">Período {expensa.periodo}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Unidad: {expensa.unidadNumero ?? expensa.unidadId?.slice(0, 8) ?? 'N/D'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Criterio: {expensa.criterioProrrateo === 'm2' ? 'm2' : 'Coeficiente'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {formatMoney(expensa.total)}
                                      </Typography>
                                      <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => handleOpenExpensaPdf(expensa.id)}>
                                        Ver PDF
                                      </Button>
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ minWidth: 640 }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Período</TableCell>
                                      <TableCell>Unidad</TableCell>
                                      <TableCell>Criterio</TableCell>
                                      <TableCell align="right">Total</TableCell>
                                      <TableCell>Detalle</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {expensas.map((expensa) => (
                                      <TableRow key={expensa.id}>
                                        <TableCell>{expensa.periodo}</TableCell>
                                        <TableCell>{expensa.unidadNumero ?? expensa.unidadId?.slice(0, 8) ?? 'N/D'}</TableCell>
                                        <TableCell>
                                          {expensa.criterioProrrateo === 'm2' ? 'm2' : 'Coeficiente'}
                                        </TableCell>
                                        <TableCell align="right">{formatMoney(expensa.total)}</TableCell>
                                        <TableCell>
                                          <Button
                                            size="small"
                                            onClick={() => handleOpenExpensaPdf(expensa.id)}
                                          >
                                            Ver PDF
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          )}
                        </Box>
                      )}

                      {dataTab === 'pagos' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Pagos
                          </Typography>
                          {pagos.length === 0 ? (
                            <Alert severity="info">No hay pagos cargados todavía.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {pagos.map((pago) => (
                                  <Paper key={`pago-card-${pago.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Stack spacing={0.6}>
                                      <Typography variant="subtitle2">{new Date(pago.fecha).toLocaleDateString('es-AR')}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Unidad: {getPagoUnidadLabel(pago)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {formatMoney(pago.monto)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Estado: {pago.estado} | Método: {pago.metodo}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" title={getPagoObservacionLabel(pago)}>
                                        {getPagoObservacionPreview(pago)}
                                      </Typography>
                                      {pago.comprobanteUrl && (
                                        <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => handleOpenComprobante(pago.comprobanteUrl)}>
                                          Ver comprobante
                                        </Button>
                                      )}
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell sx={{ width: '12%' }}>Unidad</TableCell>
                                      <TableCell sx={{ width: '14%' }}>Monto</TableCell>
                                      <TableCell sx={{ width: '14%' }}>Estado</TableCell>
                                      <TableCell sx={{ width: '24%' }}>Observación</TableCell>
                                      <TableCell sx={{ width: '14%' }}>Fecha</TableCell>
                                      <TableCell sx={{ width: '12%' }}>Comprobante</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {pagos.map((pago) => (
                                      <TableRow key={pago.id}>
                                        <TableCell>{getPagoUnidadLabel(pago)}</TableCell>
                                        <TableCell>{formatMoney(pago.monto)}</TableCell>
                                        <TableCell>{pago.estado}</TableCell>
                                        <TableCell>
                                          <Box
                                            title={getPagoObservacionLabel(pago)}
                                            sx={{
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              display: 'block',
                                            }}
                                          >
                                            {getPagoObservacionPreview(pago)}
                                          </Box>
                                        </TableCell>
                                        <TableCell>{new Date(pago.fecha).toLocaleDateString('es-AR')}</TableCell>
                                        <TableCell>
                                          {pago.comprobanteUrl ? (
                                            <Button size="small" onClick={() => handleOpenComprobante(pago.comprobanteUrl)}>Ver</Button>
                                          ) : (
                                            '-'
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          )}
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
              </Stack>
            </Box>
          )}
        </Container>
      </Box>

      <Menu
        anchorEl={mobileCardActionsAnchorEl}
        open={Boolean(mobileCardActionsAnchorEl)}
        onClose={closeMobileCardActions}
      >
        {mobileCardActions.map((action, index) => (
          <MenuItem
            key={`mobile-card-action-${index}-${action.label}`}
            onClick={() => runMobileCardAction(action.onClick)}
            sx={action.tone === 'danger' ? { color: 'error.main' } : undefined}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </ThemeProvider>
  );
}

export default App;
