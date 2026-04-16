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

type ConsorcioTipo = 'consorcio' | 'inmobiliaria' | 'propietario_individual';
type ModuloHabilitado = 'consorcio' | 'alquileres';
type TipoPropiedad = 'departamento' | 'casa' | 'local' | 'terreno' | 'cochera' | 'otro';
type UnidadFormTipo = TipoPropiedad | '';

interface Consorcio {
  id: string;
  nombre: string;
  direccion: string;
  tipo: ConsorcioTipo;
  modulos: ModuloHabilitado[];
  activo: boolean;
}

interface Unidad {
  id: string;
  numero: string;
  nombre: string | null;
  tipo: TipoPropiedad;
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

interface GastoExtra {
  id: string;
  descripcion: string;
  cantidad: number;
  fecha: string;
  consorcioId: string;
  unidadId: string;
  unidad?: {
    numero: string;
  } | null;
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

interface GastoExtraApiResponse extends Omit<GastoExtra, 'cantidad'> {
  cantidad: number | string;
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
  modules?: {
    consorcio: boolean;
    alquileres: boolean;
  };
  totalGastos: number;
  totalExpensas: number;
  totalPagos: number;
  contratosActivos?: number;
  totalAlquileresPeriodo?: number;
  totalPagosAlquiler?: number;
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

interface Alquiler {
  id: string;
  contratoId: string;
  consorcioId: string;
  unidadId: string;
  inquilinoId: string;
  periodo: string;
  monto: number;
  fechaVencimiento: string;
  fechaGeneracion: string;
  fechaPago: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'vencido';
  metodo: 'manual' | 'online' | null;
  referencia: string | null;
  comprobanteUrl: string | null;
  observacion: string | null;
  unidad?: { numero: string };
}

interface AlquilerApiResponse extends Omit<Alquiler, 'monto'> {
  monto: number | string;
}

interface GenerarAlquileresResponse {
  periodo: string;
  consorcioId: string;
  contratosActivos: number;
  generados: number;
  existentes: number;
}

interface RecordatorioAlquilerResponse {
  periodo: string;
  consorcioId: string;
  recordatoriosGenerados: number;
  proveedor: string;
}

interface MercadoPagoAlquilerPreferenceResponse {
  alquilerId: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string | null;
}

interface ContratoAlquiler {
  id: string;
  consorcioId: string;
  unidadId: string;
  inquilinoId: string;
  montoMensual: number;
  diaVencimiento: number;
  activo: boolean;
  contratoDigitalUrl?: string | null;
  createdAt: string;
  unidad?: { numero: string };
  inquilino?: { id: string; name: string; email: string };
}

interface InquilinoUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  consorcioId?: string | null;
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrador general',
  manager: 'Administrador de organización',
  owner: 'Propietario',
  tenant: 'Inquilino',
};

const consorcioTipoLabels: Record<ConsorcioTipo, string> = {
  consorcio: 'Consorcio',
  inmobiliaria: 'Inmobiliaria',
  propietario_individual: 'Propietario individual',
};

const moduloLabels: Record<ModuloHabilitado, string> = {
  consorcio: 'Consorcio',
  alquileres: 'Alquileres',
};

const tipoPropiedadLabels: Record<TipoPropiedad, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  local: 'Local',
  terreno: 'Terreno',
  cochera: 'Cochera',
  otro: 'Otro',
};

const consorcioTipoDescriptions: Record<ConsorcioTipo, string> = {
  consorcio: 'Ideal para administrar edificios con gastos, expensas y propietarios.',
  inmobiliaria: 'Ideal para administrar contratos y cobros de alquileres.',
  propietario_individual: 'Ideal para dueños que administran pocas propiedades de forma directa.',
};

const notificationTypeLabels: Record<string, string> = {
  expensa_generada: 'Expensa generada',
  pago_recibido: 'Pago recibido',
  pago_pendiente_recordatorio: 'Recordatorio de pago',
  pago_pendiente_revision_manager: 'Pago pendiente de revision',
  alquiler_generado: 'Alquiler generado',
  alquiler_pagado: 'Pago de alquiler recibido',
  alquiler_pendiente_recordatorio: 'Recordatorio de alquiler',
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

type ViewMode = 'unidades' | 'gastos' | 'gastosExtras' | 'expensas' | 'pagos' | 'propietario' | 'alquiler' | 'reportes' | 'configuracion' | 'data' | 'admin';
type DataTab = 'consorcios' | 'unidades' | 'gastos' | 'gastosExtras' | 'expensas' | 'pagos';
type MobileCardAction = {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
};

const SESSION_TOKEN_KEY = 'expensas_token';
const SESSION_USER_KEY = 'expensas_user';

const getInitialViewByRole = (role: Role): ViewMode => {
  if (role === 'owner' || role === 'tenant') {
    return 'propietario';
  }

  if (role === 'admin') {
    return 'admin';
  }

  return 'unidades';
};

const getInitialStepByRole = (role: Role): number => {
  if (role === 'owner' || role === 'tenant') {
    return 4;
  }

  if (role === 'admin') {
    return 0;
  }

  return 1;
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
  const [gastoExtraDialogOpen, setGastoExtraDialogOpen] = useState(false);
  const [editingUnidadId, setEditingUnidadId] = useState<string | null>(null);
  const [editingGastoId, setEditingGastoId] = useState<string | null>(null);
  const [editingGastoExtraId, setEditingGastoExtraId] = useState<string | null>(null);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [consorcioModalOpen, setConsorcioModalOpen] = useState(false);
  const [editingConsorcioId, setEditingConsorcioId] = useState<string | null>(null);
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
  const [unidadEditForm, setUnidadEditForm] = useState({ numero: '', nombre: '', tipo: 'departamento' as TipoPropiedad, coeficiente: '', metrosCuadrados: '', propietarioId: '' });
  const [gastoEditForm, setGastoEditForm] = useState({ descripcion: '', monto: '', fecha: '' });
  const [pagoEditForm, setPagoEditForm] = useState({ monto: '', estado: 'pendiente', metodo: 'manual' as 'manual' | 'online', referencia: '', observacion: '' });
  const [ownerEditForm, setOwnerEditForm] = useState({ name: '', email: '', phoneNumber: '', password: '', unidadId: '', consorcioId: '' });
  const [selectedDetalleExpensa, setSelectedDetalleExpensa] = useState<ExpensaDetalleResponse | null>(null);

  const [consorcios, setConsorcios] = useState<Consorcio[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gastosExtras, setGastosExtras] = useState<GastoExtra[]>([]);
  const [expensas, setExpensas] = useState<Expensa[]>([]);
interface ManagerApiResponse extends ManagedUser {}
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [contratos, setContratos] = useState<ContratoAlquiler[]>([]);
  const [inquilinos, setInquilinos] = useState<InquilinoUser[]>([]);
  const [alquilerGeneracionLoading, setAlquilerGeneracionLoading] = useState(false);
  const [alquilerReminderLoading, setAlquilerReminderLoading] = useState(false);
  const [alquilerResultado, setAlquilerResultado] = useState<GenerarAlquileresResponse | null>(null);
  const [alquilerReminderResultado, setAlquilerReminderResultado] = useState<RecordatorioAlquilerResponse | null>(null);
  const [contratoDialogOpen, setContratoDialogOpen] = useState(false);
  const [editContratoId, setEditContratoId] = useState<string | null>(null);
  const [contratoDigitalFile, setContratoDigitalFile] = useState<File | null>(null);
  const [contratoForm, setContratoForm] = useState({
    consorcioId: '',
    unidadId: '',
    inquilinoId: '',
    montoMensual: '',
    diaVencimiento: '10',
  });
  const [inquilinoDialogOpen, setInquilinoDialogOpen] = useState(false);
  const [editInquilinoId, setEditInquilinoId] = useState<string | null>(null);
  const [inquilinoForm, setInquilinoForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    consorcioId: '',
  });
  const [managers, setManagers] = useState<ManagerApiResponse[]>([]);
  const [owners, setOwners] = useState<OwnerApiResponse[]>([]);

  const [consorcioForm, setConsorcioForm] = useState({
    nombre: 'Consorcio Centro',
    direccion: 'Av. Principal 123',
    tipo: 'consorcio' as ConsorcioTipo,
    modulos: ['consorcio'] as ModuloHabilitado[],
  });
  const [unidadForm, setUnidadForm] = useState({
    numero: 'A1',
    nombre: '',
    tipo: '' as UnidadFormTipo,
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
  const [gastoExtraForm, setGastoExtraForm] = useState({
    descripcion: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    consorcioId: '',
    unidadId: '',
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
    setGastoExtraForm((current) => ({ ...current, consorcioId: nextConsorcioId, unidadId: '' }));
    setExpensaForm((current) => ({ ...current, consorcioId: nextConsorcioId }));
  };

  const syncSelectedUnidad = (nextUnidadId: string) => {
    setUnidadId(nextUnidadId);
    setPagoForm((current) => ({ ...current, unidadId: nextUnidadId }));
  };

  const applyConsorcioTipoPreset = (nextTipo: ConsorcioTipo) => {
    setConsorcioForm((current) => ({
      ...current,
      tipo: nextTipo,
      modulos:
        nextTipo === 'consorcio'
          ? ['consorcio']
          : nextTipo === 'inmobiliaria'
            ? ['alquileres']
            : current.modulos.length > 0
              ? current.modulos
              : ['alquileres'],
    }));
  };

  const toggleConsorcioModulo = (modulo: ModuloHabilitado) => {
    setConsorcioForm((current) => {
      const exists = current.modulos.includes(modulo);
      const next = exists
        ? current.modulos.filter((item) => item !== modulo)
        : [...current.modulos, modulo];

      return {
        ...current,
        modulos: [...new Set(next)],
      };
    });
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

  const clearRoleScopedData = () => {
    setConsorcios([]);
    setUnidades([]);
    setGastos([]);
    setGastosExtras([]);
    setExpensas([]);
    setPagos([]);
    setAlquileres([]);
    setContratos([]);
    setInquilinos([]);
    setOwners([]);
    setManagers([]);
    setNotificacionesHistorial([]);
    setReporteResumen(null);
    setWhatsappHealth(null);
  };

  const runMobileCardAction = (action: () => void) => {
    closeMobileCardActions();
    action();
  };

  const resetSession = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    syncedOnlinePagoIdsRef.current.clear();
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
    clearRoleScopedData();
    setAuthToken(null);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const storedUserRaw = localStorage.getItem(SESSION_USER_KEY);

    if (!storedToken || !storedUserRaw) {
      return;
    }

    try {
      const storedUser = JSON.parse(storedUserRaw) as AuthUser;
      setToken(storedToken);
      setUser(storedUser);
      setAuthToken(storedToken);

      setCurrentStep(getInitialStepByRole(storedUser.role));
      setViewMode(getInitialViewByRole(storedUser.role));
      void loadAllData(storedUser.role, storedUser);
    } catch {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
      setAuthToken(null);
    }
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem(SESSION_TOKEN_KEY, data.accessToken);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      setAuthToken(data.accessToken);
      setMessage('');
      setCurrentStep(getInitialStepByRole(data.user.role));
      setViewMode(getInitialViewByRole(data.user.role));
      setOwnerPaymentReceipt(null);
      setManualPaymentExpensa(null);
      setManualComprobanteFile(null);
      setMobileMenuOpen(false);
      clearRoleScopedData();
      await loadAllData(data.user.role, data.user);
    } catch {
      setMessage('No se pudo iniciar sesión');
    }
  };

  const loadAllData = async (targetRole?: Role, targetUser?: AuthUser | null) => {
    const activeUser = targetUser ?? user;
    const activeRole = targetRole ?? activeUser?.role;

    // Fallback defensivo para manager: fija consorcio desde sesión antes de cargar módulos.
    if (activeRole === 'manager' && activeUser?.consorcioId) {
      syncSelectedConsorcio(activeUser.consorcioId);
    }

    try {
      if (activeRole === 'owner' || activeRole === 'tenant') {
        // Limpiamos primero para evitar mostrar datos de otra sesión/rol mientras carga.
        setConsorcios([]);
        setUnidades([]);
        setGastos([]);
        setGastosExtras([]);
        setOwners([]);
        setManagers([]);
        setContratos([]);
        setInquilinos([]);
        setNotificacionesHistorial([]);
        setReporteResumen(null);
        setWhatsappHealth(null);
        setExpensas([]);
        setPagos([]);
        setAlquileres([]);

        const [expensasResponse, pagosResponse] = await Promise.all([
          apiClient.get<ExpensaApiResponse[]>('/expensas'),
          apiClient.get<PagoApiResponse[]>('/pagos'),
        ]);

        const alquileresResponse =
          activeRole === 'tenant'
            ? await apiClient.get<AlquilerApiResponse[]>('/alquileres')
            : { data: [] as AlquilerApiResponse[] };

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
        const nextAlquileres = alquileresResponse.data.map((alquiler) => ({
          ...alquiler,
          monto: toNumber(alquiler.monto),
        }));

        setExpensas(nextExpensas);
        setPagos(nextPagos);
        setAlquileres(nextAlquileres);
        setMobileUnidadesDisplayCount(20);
        setMobileGastosDisplayCount(20);
        setMobileExpensasDisplayCount(20);
        setMobilePagosDisplayCount(20);
        return;
      }

      const [consorciosResponse, unidadesResponse, gastosResponse, expensasResponse, pagosResponse, alquileresResponse, contratosResponse, inquilinosResponse, ownersResponse, historialResponse] = await Promise.all([
        apiClient.get<Consorcio[]>('/consorcios'),
        apiClient.get<UnidadApiResponse[]>('/unidades'),
        apiClient.get<GastoApiResponse[]>('/gastos'),
        apiClient.get<ExpensaApiResponse[]>('/expensas'),
        apiClient.get<PagoApiResponse[]>('/pagos'),
        apiClient.get<AlquilerApiResponse[]>('/alquileres', {
          params: {
            periodo: reportePeriodo,
            consorcioId: activeRole === 'admin' ? reporteConsorcioId || undefined : undefined,
          },
        }),
        apiClient.get<ContratoAlquiler[]>('/alquileres/contratos'),
        apiClient.get<InquilinoUser[]>('/users/tenants'),
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
      const nextAlquileres = alquileresResponse.data.map((alquiler) => ({
        ...alquiler,
        monto: toNumber(alquiler.monto),
      }));

      setConsorcios(nextConsorcios);
      setUnidades(nextUnidades);
      setGastos(nextGastos);
      setExpensas(nextExpensas);
      setPagos(nextPagos);
      setAlquileres(nextAlquileres);
      setContratos(contratosResponse.data.map((c) => ({ ...c, montoMensual: toNumber(c.montoMensual) })));
      setInquilinos(inquilinosResponse.data);
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

      const managerConsorcio =
        activeRole === 'manager'
          ? nextConsorcios.find((consorcio) => consorcio.id === activeUser?.consorcioId)
          : null;
      const shouldLoadGastosExtras =
        activeRole === 'admin' ||
        (activeRole === 'manager' && managerConsorcio?.tipo === 'inmobiliaria');

      if (shouldLoadGastosExtras) {
        try {
          const gastosExtrasResponse = await apiClient.get<GastoExtraApiResponse[]>('/gastos-extras');
          const nextGastosExtras = gastosExtrasResponse.data.map((gastoExtra) => ({
            ...gastoExtra,
            cantidad: toNumber(gastoExtra.cantidad),
          }));
          setGastosExtras(nextGastosExtras);
        } catch {
          setGastosExtras([]);
        }
      } else {
        setGastosExtras([]);
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
        if (editingConsorcioId) {
          const { data } = await apiClient.patch<Consorcio>(`/consorcios/${editingConsorcioId}`, {
            nombre: consorcioForm.nombre,
            direccion: consorcioForm.direccion,
            tipo: consorcioForm.tipo,
            modulos: consorcioForm.modulos,
          });
          setConsorcioModalOpen(false);
          return data;
        }
        const { data } = await apiClient.post<Consorcio>('/consorcios', {
          nombre: consorcioForm.nombre,
          direccion: consorcioForm.direccion,
          tipo: consorcioForm.tipo,
          modulos: consorcioForm.modulos,
        });
        setConsorcioModalOpen(false);
        syncSelectedConsorcio(data.id);
        return data;
      },
      editingConsorcioId ? 'Organización actualizada' : 'Organización creada',
      (consorcio) => ({
        title: editingConsorcioId ? 'Organización actualizada' : 'Organización creada',
        description: editingConsorcioId
          ? 'Los datos de la organización fueron actualizados.'
          : 'La organización quedó disponible para crear unidades, gastos y expensas.',
        fields: [
          { label: 'Nombre', value: consorcio.nombre },
          { label: 'Dirección', value: consorcio.direccion },
          { label: 'Tipo', value: consorcioTipoLabels[consorcio.tipo] },
          {
            label: 'Módulos',
            value: consorcio.modulos.map((modulo) => moduloLabels[modulo]).join(', '),
          },
        ],
      }),
    );

  const handleToggleConsorcioActivo = (consorcio: Consorcio) =>
    runAction(
      async () => {
        const { data } = await apiClient.patch<Consorcio>(`/consorcios/${consorcio.id}`, {
          activo: !consorcio.activo,
        });
        return data;
      },
      consorcio.activo ? 'Organización desactivada' : 'Organización activada',
      () => ({}),
    );

  const handleCreateUnidad = () =>
    handleCreateUnidadWithFlow(false);

  const handleCreateUnidadAndStay = () =>
    handleCreateUnidadWithFlow(true);

  const handleCreateUnidadWithFlow = (stayOnStep: boolean) =>
    runAction(
      async () => {
        const selectedConsorcio = consorcios.find((c) => c.id === unidadForm.consorcioId);
        const tipoUnidad: TipoPropiedad =
          selectedConsorcio?.tipo === 'consorcio'
            ? 'departamento'
            : (unidadForm.tipo as TipoPropiedad);
        const coeficienteUnidad = tipoUnidad === 'departamento'
          ? Number(unidadForm.coeficiente)
          : 0;

        const { data } = await apiClient.post<Unidad>('/unidades', {
          numero: unidadForm.numero,
          nombre: unidadForm.nombre.trim() || undefined,
          tipo: tipoUnidad,
          coeficiente: coeficienteUnidad,
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
          nombre: '',
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
          { label: 'Nombre', value: unidad.nombre?.trim() || 'Sin nombre' },
          { label: 'Tipo', value: tipoPropiedadLabels[unidad.tipo] },
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

  const handleOpenCreateConsorcio = () => {
    setEditingConsorcioId(null);
    setConsorcioForm({ nombre: '', direccion: '', tipo: 'consorcio', modulos: ['consorcio'] });
    setConsorcioModalOpen(true);
  };

  const handleOpenEditConsorcio = (consorcio: Consorcio) => {
    setEditingConsorcioId(consorcio.id);
    setConsorcioForm({
      nombre: consorcio.nombre,
      direccion: consorcio.direccion,
      tipo: consorcio.tipo,
      modulos: [...consorcio.modulos],
    });
    setConsorcioModalOpen(true);
  };

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
      consorcioId: assignedUnidad?.consorcioId ?? owner.consorcioId ?? '',
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
      consorcioId: user?.role === 'manager' ? user.consorcioId ?? '' : consorcioId || consorcios[0]?.id || '',
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
            consorcioId: ownerEditForm.consorcioId || undefined,
          });
          setOwnerModalOpen(false);
          setEditingOwnerId(null);
          return data;
        }

        const { data } = await apiClient.post<ManagedUser>('/users/owners', {
          name: ownerEditForm.name,
          email: ownerEditForm.email,
          phoneNumber: ownerEditForm.phoneNumber.trim() || null,
          password: ownerEditForm.password,
          unidadId: ownerEditForm.unidadId || undefined,
          consorcioId: ownerEditForm.consorcioId || undefined,
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
            label: 'Organización',
            value: consorcios.find((consorcio) => consorcio.id === ownerEditForm.consorcioId)?.nombre ?? 'Sin asignar',
          },
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

  const handleOpenCreateGastoExtra = () => {
    setEditingGastoExtraId(null);
    setGastoExtraForm({
      descripcion: '',
      cantidad: '',
      fecha: new Date().toISOString().split('T')[0],
      consorcioId:
        user?.role === 'manager'
          ? user.consorcioId ?? consorcioId
          : consorcioId || reporteConsorcioId || consorcios[0]?.id || '',
      unidadId: '',
    });
    setGastoExtraDialogOpen(true);
  };

  const handleStartEditGastoExtra = (gastoExtra: GastoExtra) => {
    setEditingGastoExtraId(gastoExtra.id);
    setGastoExtraForm({
      descripcion: gastoExtra.descripcion,
      cantidad: String(gastoExtra.cantidad),
      fecha: gastoExtra.fecha,
      consorcioId: gastoExtra.consorcioId,
      unidadId: gastoExtra.unidadId,
    });
    setGastoExtraDialogOpen(true);
  };

  const handleSaveGastoExtra = () =>
    runAction(
      async () => {
        if (editingGastoExtraId) {
          const { data } = await apiClient.patch<GastoExtra>(`/gastos-extras/${editingGastoExtraId}`, {
            descripcion: gastoExtraForm.descripcion,
            cantidad: Number(gastoExtraForm.cantidad),
            fecha: gastoExtraForm.fecha,
            unidadId: gastoExtraForm.unidadId,
          });
          setEditingGastoExtraId(null);
          setGastoExtraDialogOpen(false);
          return data;
        }

        const { data } = await apiClient.post<GastoExtra>('/gastos-extras', {
          descripcion: gastoExtraForm.descripcion,
          cantidad: Number(gastoExtraForm.cantidad),
          fecha: gastoExtraForm.fecha,
          consorcioId: gastoExtraForm.consorcioId,
          unidadId: gastoExtraForm.unidadId,
        });
        setGastoExtraDialogOpen(false);
        return data;
      },
      editingGastoExtraId ? 'Gasto extra actualizado' : 'Gasto extra registrado',
      (gastoExtra) => ({
        title: editingGastoExtraId ? 'Gasto extra actualizado' : 'Gasto extra registrado',
        description: 'El gasto extra quedó asociado a la unidad seleccionada.',
        fields: [
          { label: 'Descripción', value: gastoExtra.descripcion },
          { label: 'Cantidad', value: formatMoney(gastoExtra.cantidad) },
          { label: 'Fecha', value: new Date(gastoExtra.fecha).toLocaleDateString('es-AR') },
          { label: 'Unidad', value: unidades.find((u) => u.id === gastoExtra.unidadId)?.numero ?? gastoExtra.unidadId },
        ],
      }),
    );

  const handleDeleteGastoExtra = (id: string) =>
    runAction(
      async () => {
        await apiClient.delete(`/gastos-extras/${id}`);
        return { id };
      },
      'Gasto extra eliminado',
      () => ({
        title: 'Gasto extra eliminado',
        description: 'El registro de gasto extra fue eliminado.',
        fields: [],
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
      nombre: unidad.nombre ?? '',
      tipo: unidad.tipo,
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
          nombre: unidadEditForm.nombre.trim() || null,
          tipo: unidadEditForm.tipo,
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
          { label: 'Nombre', value: unidad.nombre?.trim() || 'Sin nombre' },
          { label: 'Tipo', value: tipoPropiedadLabels[unidad.tipo] },
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
    const alquilerId = params.get('alquilerId');

    if (!pagoId && !alquilerId) {
      return;
    }

    try {
      if (pagoId) {
        const { data } = await apiClient.post<Pago>(`/pagos/${pagoId}/mercadopago/sync`);
        const normalizedPago = {
          ...data,
          monto: toNumber((data as unknown as { monto: string | number }).monto),
        };
        setOwnerPaymentReceipt(normalizedPago);
      }

      if (alquilerId) {
        await apiClient.post<Alquiler>(`/alquileres/${alquilerId}/mercadopago/sync`);
      }

      await loadAllData(user?.role);
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
      try {
        const { data } = await apiClient.post<Pago>(`/pagos/${pago.id}/mercadopago/sync`);
        const syncedPago = {
          ...data,
          monto: toNumber((data as unknown as { monto: string | number }).monto),
          unidadNumero: data.unidad?.numero,
        };

        // Solo dejamos de reintentar cuando el estado deja de estar pendiente.
        if (syncedPago.estado !== 'pendiente') {
          syncedOnlinePagoIdsRef.current.add(pago.id);
          latestSyncedPago = syncedPago;
        }
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
      if (user?.role === 'admin') {
        await handleLoadNotificationHistory();
      }
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

  const handleGenerarAlquileres = async () => {
    try {
      if (user?.role === 'admin' && !reporteConsorcioId) {
        setMessage('Selecciona un consorcio para generar alquileres.');
        return;
      }

      setAlquilerGeneracionLoading(true);
      const { data } = await apiClient.post<GenerarAlquileresResponse>('/alquileres/generar', {
        periodo: reportePeriodo,
        consorcioId: reporteConsorcioId || undefined,
      });
      setAlquilerResultado(data);
      await loadAllData();
      setMessage('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudieron generar alquileres';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setAlquilerGeneracionLoading(false);
    }
  };

  const handleRecordarAlquileres = async () => {
    try {
      if (user?.role === 'admin' && !reporteConsorcioId) {
        setMessage('Selecciona un consorcio para enviar recordatorios de alquiler.');
        return;
      }

      setAlquilerReminderLoading(true);
      const { data } = await apiClient.post<RecordatorioAlquilerResponse>('/alquileres/recordatorios', {
        periodo: reportePeriodo,
        consorcioId: reporteConsorcioId || undefined,
      });
      setAlquilerReminderResultado(data);
      if (user?.role === 'admin') {
        await handleLoadNotificationHistory();
      }
      setMessage('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudieron enviar recordatorios de alquiler';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setAlquilerReminderLoading(false);
    }
  };

  const handlePagarAlquilerOnline = async (alquiler: Alquiler) => {
    const checkoutWindow = window.open('', '_blank');

    try {
      const { data } = await apiClient.post<MercadoPagoAlquilerPreferenceResponse>(
        `/alquileres/${alquiler.id}/mercadopago/preference`,
      );

      const redirectUrl = data.initPoint || data.sandboxInitPoint;
      if (!redirectUrl) {
        throw new Error('Mercado Pago no devolvió URL de checkout');
      }

      if (checkoutWindow) {
        checkoutWindow.location.href = redirectUrl;
      } else {
        window.location.href = redirectUrl;
      }
    } catch (error: any) {
      if (checkoutWindow && checkoutWindow.location.href === 'about:blank') {
        checkoutWindow.close();
      }
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo iniciar el pago de alquiler';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const handleRegistrarPagoAlquilerManual = async (alquilerId: string) => {
    try {
      await apiClient.patch(`/alquileres/${alquilerId}/pago-manual`, {});
      await loadAllData();
      setMessage('Pago de alquiler registrado manualmente.');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo registrar el pago manual de alquiler';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const handleOpenContratoDialog = (contrato?: ContratoAlquiler) => {
    setContratoDigitalFile(null);

    if (contrato) {
      setEditContratoId(contrato.id);
      setContratoForm({
        consorcioId: contrato.consorcioId,
        unidadId: contrato.unidadId,
        inquilinoId: contrato.inquilinoId,
        montoMensual: String(contrato.montoMensual),
        diaVencimiento: String(contrato.diaVencimiento),
      });
    } else {
      setEditContratoId(null);
      setContratoForm({
        consorcioId: user?.role === 'manager' ? (consorcios[0]?.id ?? '') : (reporteConsorcioId || consorcios[0]?.id || ''),
        unidadId: '',
        inquilinoId: '',
        montoMensual: '',
        diaVencimiento: '10',
      });
    }
    setContratoDialogOpen(true);
  };

  const handleSaveContrato = async () => {
    try {
      const payload = {
        consorcioId: contratoForm.consorcioId,
        unidadId: contratoForm.unidadId,
        inquilinoId: contratoForm.inquilinoId,
        montoMensual: parseFloat(contratoForm.montoMensual),
        diaVencimiento: parseInt(contratoForm.diaVencimiento, 10),
      };

      const uploadContratoDigital = async (contratoId: string) => {
        if (!contratoDigitalFile) {
          return;
        }

        const formData = new FormData();
        formData.append('file', contratoDigitalFile);
        await apiClient.post(`/alquileres/contratos/${contratoId}/documento`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      };

      if (editContratoId) {
        await apiClient.patch(`/alquileres/contratos/${editContratoId}`, {
          inquilinoId: payload.inquilinoId,
          montoMensual: payload.montoMensual,
          diaVencimiento: payload.diaVencimiento,
        });
        await uploadContratoDigital(editContratoId);
        setMessage('Contrato actualizado.');
      } else {
        const { data } = await apiClient.post<ContratoAlquiler>('/alquileres/contratos', payload);
        await uploadContratoDigital(data.id);
        setMessage('Contrato de alquiler creado.');
      }
      setContratoDialogOpen(false);
      setContratoDigitalFile(null);
      await loadAllData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo guardar el contrato';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const handleDeactivateContrato = async (contratoId: string) => {
    try {
      await apiClient.patch(`/alquileres/contratos/${contratoId}`, { activo: false });
      setMessage('Contrato desactivado.');
      await loadAllData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo desactivar el contrato';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const handleOpenInquilinoDialog = (inquilino?: InquilinoUser) => {
    if (inquilino) {
      setEditInquilinoId(inquilino.id);
      setInquilinoForm({
        name: inquilino.name,
        email: inquilino.email,
        phoneNumber: inquilino.phoneNumber ?? '',
        password: '',
        consorcioId: inquilino.consorcioId ?? '',
      });
    } else {
      setEditInquilinoId(null);
      setInquilinoForm({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        consorcioId: user?.role === 'admin' ? (reporteConsorcioId || consorcios[0]?.id || '') : '',
      });
    }
    setInquilinoDialogOpen(true);
  };

  const handleSaveInquilino = async () => {
    try {
      if (editInquilinoId) {
        const body: Record<string, string> = {};
        if (inquilinoForm.name) body.name = inquilinoForm.name;
        if (inquilinoForm.email) body.email = inquilinoForm.email;
        if (inquilinoForm.phoneNumber) body.phoneNumber = inquilinoForm.phoneNumber;
        if (inquilinoForm.password) body.password = inquilinoForm.password;
        await apiClient.patch(`/users/tenants/${editInquilinoId}`, body);
        setMessage('Inquilino actualizado.');
      } else {
        await apiClient.post('/users/tenants', {
          name: inquilinoForm.name,
          email: inquilinoForm.email,
          phoneNumber: inquilinoForm.phoneNumber || undefined,
          password: inquilinoForm.password,
          consorcioId: inquilinoForm.consorcioId || undefined,
        });
        setMessage('Inquilino creado.');
      }
      setInquilinoDialogOpen(false);
      await loadAllData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo guardar el inquilino';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const handleRemoveInquilino = async (inquilinoId: string) => {
    try {
      await apiClient.delete(`/users/tenants/${inquilinoId}`);
      setMessage('Inquilino eliminado.');
      await loadAllData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'No se pudo eliminar el inquilino';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const syncPendingAlquileresOnline = async () => {
    try {
      const pending = alquileres.filter((item) => item.estado === 'pendiente' && item.metodo === 'online');
      if (pending.length === 0) {
        return;
      }

      for (const alquiler of pending) {
        try {
          await apiClient.post(`/alquileres/${alquiler.id}/mercadopago/sync`);
        } catch (error) {
          console.warn('No se pudo sincronizar alquiler online pendiente', alquiler.id, error);
        }
      }

      await loadAllData();
    } catch (error) {
      console.warn('Error sincronizando alquileres online', error);
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
          <Typography variant="subtitle2">Tipo de cliente</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
            {(Object.keys(consorcioTipoLabels) as ConsorcioTipo[]).map((tipo) => {
              const selected = consorcioForm.tipo === tipo;
              return (
                <Paper
                  key={`setup-tipo-${tipo}`}
                  elevation={0}
                  onClick={() => applyConsorcioTipoPreset(tipo)}
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    border: selected ? '2px solid #2a9d8f' : '1px solid #dce9e4',
                    backgroundColor: selected ? '#edf7f3' : '#fff',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  <Typography variant="subtitle2">{consorcioTipoLabels[tipo]}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {consorcioTipoDescriptions[tipo]}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
          <TextField
            label="Nombre de la organización"
            value={consorcioForm.nombre}
            onChange={(event) => setConsorcioForm((current) => ({ ...current, nombre: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Dirección principal"
            value={consorcioForm.direccion}
            onChange={(event) => setConsorcioForm((current) => ({ ...current, direccion: event.target.value }))}
            fullWidth
          />
          <Stack spacing={0.8}>
            <Typography variant="subtitle2">Servicios habilitados</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(Object.keys(moduloLabels) as ModuloHabilitado[]).map((modulo) => {
                const active = consorcioForm.modulos.includes(modulo);
                return (
                  <Chip
                    key={`setup-modulo-${modulo}`}
                    label={moduloLabels[modulo]}
                    color={active ? 'primary' : 'default'}
                    variant={active ? 'filled' : 'outlined'}
                    onClick={() => toggleConsorcioModulo(modulo)}
                  />
                );
              })}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Tip: activa ambos servicios si el cliente quiere gestionar consorcios y alquileres en la misma cuenta.
            </Typography>
          </Stack>
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
            label="Nombre de la propiedad (opcional)"
            value={unidadForm.nombre}
            onChange={(event) => setUnidadForm((current) => ({ ...current, nombre: event.target.value }))}
            fullWidth
          />
{(() => {
            const formConsorcio = consorcios.find((c) => c.id === unidadForm.consorcioId);
            const tipoLocked = formConsorcio?.tipo === 'consorcio';
            return tipoLocked ? (
              <TextField
                label="Tipo de propiedad"
                value={tipoPropiedadLabels[(unidadForm.tipo || 'departamento') as TipoPropiedad]}
                fullWidth
                InputProps={{ readOnly: true }}
                helperText="Fijo para organizaciones de tipo consorcio"
              />
            ) : (
              <TextField
                select
                label="Tipo de propiedad"
                value={unidadForm.tipo}
                onChange={(event) =>
                  setUnidadForm((current) => {
                    const nextTipo = event.target.value as UnidadFormTipo;
                    if (nextTipo === 'departamento') {
                      const coeficienteActual = Number(current.coeficiente);
                      return {
                        ...current,
                        tipo: nextTipo,
                        coeficiente:
                          Number.isNaN(coeficienteActual) || coeficienteActual <= 0
                            ? '0.10'
                            : current.coeficiente,
                      };
                    }

                    return {
                      ...current,
                      tipo: nextTipo,
                      coeficiente: '0',
                    };
                  })
                }
                fullWidth
              >
                <MenuItem value="">
                  <em>Seleccionar tipo</em>
                </MenuItem>
                {(Object.keys(tipoPropiedadLabels) as TipoPropiedad[]).map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipoPropiedadLabels[tipo]}
                  </MenuItem>
                ))}
              </TextField>
            );
          })()}
          {(() => {
            const formConsorcio = consorcios.find((c) => c.id === unidadForm.consorcioId);
            const tipoLocked = formConsorcio?.tipo === 'consorcio';
            const tipoUnidad = tipoLocked ? 'departamento' : unidadForm.tipo;
            const requiereCoeficiente = tipoUnidad === 'departamento';

            return (
              <TextField
                label="Coeficiente"
                type="number"
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                value={requiereCoeficiente ? unidadForm.coeficiente : '0'}
                onChange={(event) => setUnidadForm((current) => ({ ...current, coeficiente: event.target.value }))}
                fullWidth
                disabled={!requiereCoeficiente}
                helperText={
                  requiereCoeficiente
                    ? 'Obligatorio para departamento.'
                    : 'No aplica para este tipo de propiedad.'
                }
              />
            );
          })()}
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
        title: 'Crear organización cliente',
        description: isManager
          ? 'El alta de nuevas organizaciones corresponde al administrador general. Como manager operas sobre la organización ya asignada.'
          : 'Primero defines el tipo de cliente y los servicios activos. Luego podrás cargar propiedades, contratos, expensas y cobros según corresponda.',
        action: handleCreateConsorcio,
        buttonLabel: 'Guardar organización',
        disabled:
          isManager ||
          !consorcioForm.nombre.trim() ||
          !consorcioForm.direccion.trim() ||
          consorcioForm.modulos.length === 0,
      };
    }

    if (currentStep === 1) {
      const formConsorcio = consorcios.find((c) => c.id === unidadForm.consorcioId);
      const tipoLocked = formConsorcio?.tipo === 'consorcio';
      const tipoUnidad = tipoLocked ? 'departamento' : unidadForm.tipo;
      const requiereCoeficiente = tipoUnidad === 'departamento';
      return {
        title: 'Crear unidad',
        description: formConsorcio?.tipo === 'inmobiliaria'
          ? 'Crea las unidades para asociarlas luego a contratos e inquilinos desde Administración de alquileres.'
          : 'El administrador del consorcio crea las unidades dentro del edificio elegido. Ya puedes cargar número y coeficiente reales.',
        action: handleCreateUnidad,
        buttonLabel: 'Guardar unidad',
        disabled:
          !unidadForm.consorcioId ||
          !unidadForm.numero.trim() ||
          (requiereCoeficiente &&
            (Number.isNaN(Number(unidadForm.coeficiente)) ||
              Number(unidadForm.coeficiente) <= 0)),
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
                      {tipoPropiedadLabels[unidad.tipo]} {unidad.numero}
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
                    Nombre: {unidad.nombre?.trim() || '-'}
                  </Typography>
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
            <Table size="small" sx={{ minWidth: 920 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Nombre</TableCell>
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
                    <TableCell>{tipoPropiedadLabels[unidad.tipo]}</TableCell>
                    <TableCell>{unidad.nombre?.trim() || '-'}</TableCell>
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

          <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 980 }}>
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
      const formConsorcio = consorcios.find((c) => c.id === unidadForm.consorcioId);
      const tipoLocked = formConsorcio?.tipo === 'consorcio';
      const tipoUnidad = tipoLocked ? 'departamento' : unidadForm.tipo;
      const requiereCoeficiente = tipoUnidad === 'departamento';
      if (!unidadForm.consorcioId) issues.push('Selecciona un consorcio.');
      if (!unidadForm.numero.trim()) issues.push('Ingresa el numero de unidad.');
      if (!tipoLocked && !unidadForm.tipo) issues.push('Selecciona un tipo de propiedad.');
      if (
        requiereCoeficiente &&
        (Number.isNaN(Number(unidadForm.coeficiente)) || Number(unidadForm.coeficiente) <= 0)
      ) {
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
  const totalRegistros = consorcios.length + unidades.length + gastos.length + gastosExtras.length + expensas.length + pagos.length + alquileres.length;
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

  const activeConsorcio = consorcios.find((c) => c.id === consorcioId) ?? null;
  const activeConsorcioIsConsorcioType = activeConsorcio?.tipo === 'consorcio';
  const managerHasConsorcioModule =
    user?.role !== 'manager' || (activeConsorcio?.modulos?.includes('consorcio') ?? false);
  const managerHasAlquileresModule =
    user?.role !== 'manager' || (activeConsorcio?.modulos?.includes('alquileres') ?? false);
  const managerIsInmobiliaria = user?.role === 'manager' && activeConsorcio?.tipo === 'inmobiliaria';

  const navItems: Array<{
    key: ViewMode;
    title: string;
    subtitle: string;
    meta: string;
    visible: boolean;
  }> = [
    
    {
      key: 'unidades',
      title: user?.role === 'manager' && managerHasConsorcioModule ? 'Unidades y Propietarios' : 'Unidades',
      subtitle: 'Alta, edición y baja',
      meta: `${unidades.length} unidades`,
      visible: user?.role === 'admin' || user?.role === 'manager',
    },
    {
      key: 'gastos',
      title: 'Gastos del mes',
      subtitle: 'Carga de gastos comunes',
      meta: `${gastos.length} gastos`,
      visible: user?.role === 'admin' || (user?.role === 'manager' && managerHasConsorcioModule),
    },
    {
      key: 'gastosExtras',
      title: 'Gastos extras',
      subtitle: 'Registro por unidad',
      meta: `${gastosExtras.length} gastos`,
      visible: user?.role === 'admin' || managerIsInmobiliaria,
    },
    {
      key: 'expensas',
      title: 'Generar expensas',
      subtitle: 'Liquidación por unidad',
      meta: `${expensas.length} expensas`,
      visible: user?.role === 'admin' || (user?.role === 'manager' && managerHasConsorcioModule),
    },
    {
      key: 'pagos',
      title: 'Registrar pago',
      subtitle: 'Manual u online',
      meta: `${pagos.length} pagos`,
      visible: user?.role === 'admin' || (user?.role === 'manager' && managerHasConsorcioModule),
    },
    {
      key: 'propietario',
      title: user?.role === 'tenant' ? 'Portal inquilino' : 'Portal propietario',
      subtitle: 'Ver expensa y pagar',
      meta: `${expensas.length} expensas`,
      visible: user?.role === 'owner' || user?.role === 'tenant',
    },
    {
      key: 'alquiler',
      title: user?.role === 'tenant' ? 'Mi alquiler' : 'Administración de alquileres',
      subtitle: user?.role === 'tenant' ? 'Deuda y pagos de alquiler' : 'Gestión mensual y cobranza',
      meta: `${alquileres.length} alquileres`,
      visible: user?.role === 'admin' || user?.role === 'tenant' || (user?.role === 'manager' && managerHasAlquileresModule),
    },
    {
      key: 'reportes',
      title: 'Reportes',
      subtitle: 'Resumen mensual',
      meta: reportePeriodo,
      visible: user?.role === 'admin' || user?.role === 'manager',
    },
    {
      key: 'configuracion',
      title: user?.role === 'manager' ? 'Recordatorio de la organización' : 'Configuración',
      subtitle: user?.role === 'manager' ? 'Recordatorios de la organización' : 'Integraciones y notificaciones',
      meta: user?.role === 'manager' ? '' : 'WhatsApp y Mercado Pago',
      visible: user?.role === 'admin' || (user?.role === 'manager' && managerHasConsorcioModule),
    },
    {
      key: 'data',
      title: 'Tablas y registros',
      subtitle: 'Consulta historial completo',
      meta: `${totalRegistros} registros`,
      visible: user?.role === 'admin' || user?.role === 'manager',
    },
    {
      key: 'admin',
      title: 'Administración',
      subtitle: 'Alta de managers',
      meta: `${consorcios.length} consorcios`,
      visible: user?.role === 'admin',
    },
  ];

  const navOrderByRole: Record<Role, ViewMode[]> = {
    admin: ['admin', 'unidades', 'gastos', 'gastosExtras', 'expensas', 'pagos', 'alquiler', 'reportes', 'configuracion', 'data'],
    manager: ['unidades', 'gastos', 'gastosExtras', 'expensas', 'pagos', 'alquiler', 'reportes', 'configuracion', 'data'],
    owner: ['propietario'],
    tenant: ['propietario', 'alquiler'],
  };

  const visibleNavItems = navItems
    .filter((item) => item.visible)
    .sort((a, b) => {
      if (!user?.role) {
        return 0;
      }

      const order = navOrderByRole[user.role];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });

  // Determina qué tabs mostrar en "Tablas y registros"
  const getDataTabs = (): DataTab[] => {
    if (user?.role === 'admin') {
      return ['consorcios', 'unidades', 'gastos', 'gastosExtras', 'expensas', 'pagos'];
    }

    if (managerIsInmobiliaria) {
      // Para manager de inmobiliaria: mostrar unidades, gastos, gastosExtras y pagos (sin expensas)
      return ['consorcios', 'unidades', 'gastos', 'gastosExtras', 'pagos'];
    }

    // Para manager de consorcio: ocultar gastosExtras
    return ['consorcios', 'unidades', 'gastos', 'expensas', 'pagos'];
  };
  
  const AVAILABLE_DATA_TABS = getDataTabs();
  const dataTabLabels: Record<DataTab, string> = {
    consorcios: 'Organizaciones',
    unidades: 'Unidades',
    gastos: 'Gastos',
    gastosExtras: 'Gastos extras',
    expensas: 'Expensas',
    pagos: 'Pagos',
  };
  const dataTabCounts: Record<DataTab, number> = {
    consorcios: consorcios.length,
    unidades: unidades.length,
    gastos: gastos.length,
    gastosExtras: gastosExtras.length,
    expensas: expensas.length,
    pagos: pagos.length,
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const hasCurrentView = visibleNavItems.some((item) => item.key === viewMode);
    if (!hasCurrentView && visibleNavItems.length > 0) {
      selectView(visibleNavItems[0].key);
    }
  }, [user, viewMode, visibleNavItems]);

  // Ajusta dataTab si no está disponible para el tipo de organización actual
  useEffect(() => {
    const tabs = getDataTabs();
    if (!tabs.includes(dataTab)) {
      setDataTab(tabs[0]);
    }
  }, [user?.role, managerIsInmobiliaria, dataTab]);

  const canManageIntegraciones = user?.role === 'admin';
  const reporteHasConsorcioModule = reporteResumen?.modules?.consorcio ?? managerHasConsorcioModule;
  const reporteHasAlquileresModule = reporteResumen?.modules?.alquileres ?? managerHasAlquileresModule;

  const viewTitleByMode: Record<ViewMode, string> = {
    unidades: user?.role === 'manager' && managerHasConsorcioModule ? 'Unidades y Propietarios' : 'Unidades',
    gastos: 'Gastos',
    gastosExtras: 'Gastos extras',
    expensas: 'Expensas',
    pagos: 'Pagos',
    propietario: user?.role === 'tenant' ? 'Portal inquilino' : 'Portal propietario',
    alquiler: user?.role === 'tenant' ? 'Mi alquiler' : 'Administración de alquileres',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    data: 'Tablas',
    admin: 'Administración',
  };
  const viewTitle =
    viewMode === 'configuracion' && user?.role === 'manager'
      ? 'Recordatorio del consorcio'
      : viewTitleByMode[viewMode];

  const navIconByView: Record<ViewMode, ReactNode> = {
    unidades: <ApartmentIcon fontSize="small" />,
    gastos: <ReceiptLongIcon fontSize="small" />,
    gastosExtras: <ReceiptLongIcon fontSize="small" />,
    expensas: <DescriptionIcon fontSize="small" />,
    pagos: <PaymentsIcon fontSize="small" />,
    propietario: <PersonIcon fontSize="small" />,
    alquiler: <PaymentsIcon fontSize="small" />,
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
    if (!token || (user?.role !== 'owner' && user?.role !== 'tenant')) {
      return;
    }

    void syncMercadoPagoReturnIfNeeded();
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || (user?.role !== 'owner' && user?.role !== 'tenant') || pagos.length === 0) {
      return;
    }

    void syncPendingOwnerOnlinePayments();
  }, [token, user?.role, pagos]);

  useEffect(() => {
    if (!token || user?.role !== 'tenant' || alquileres.length === 0) {
      return;
    }

    void syncPendingAlquileresOnline();
  }, [token, user?.role, alquileres]);

  useEffect(() => {
    if (!token || (user?.role !== 'owner' && user?.role !== 'tenant')) {
      return;
    }

    const handleFocus = () => {
      void loadAllData(user.role);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role === 'owner' || user?.role === 'tenant' || viewMode !== 'configuracion') {
      return;
    }

    if (user?.role !== 'admin') {
      return;
    }

    if (!reporteConsorcioId) {
      return;
    }

    void handleLoadWhatsappHealth();

    void handleLoadConsorcioIntegracion();
  }, [token, user?.role, viewMode, reporteConsorcioId]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          py: { xs: 2, md: 5 },
          background:
            'radial-gradient(circle at top left, rgba(0,95,115,0.14), transparent 28%), linear-gradient(180deg, #f2f7f4 0%, #eef4f1 100%)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ mb: { xs: 2.5, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.4, fontSize: { xs: '1.55rem', sm: '1.9rem', md: '2.125rem' }, lineHeight: 1.15 }}>Gestión de Organizaciones</Typography>
                {token && (
                  <Typography variant="body2" color="text.secondary">
                    Sección activa: {viewTitle}
                  </Typography>
                )}
              </Box>
            </Stack>
            {token && <Button variant="outlined" onClick={resetSession} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cerrar sesión</Button>}
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
                <Box sx={{ width: { xs: 'min(92vw, 320px)', sm: 320 }, p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Menú</Typography>
                    <IconButton onClick={() => setMobileMenuOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                  <Stack spacing={1.2}>
                    {visibleNavItems.map((item) => (
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
                        {visibleNavItems.map((item) => (
                          <Button
                            key={item.key}
                            fullWidth
                            startIcon={navIconByView[item.key]}
                            variant={viewMode === item.key ? 'contained' : 'outlined'}
                            onClick={() => selectView(item.key)}
                            sx={{
                              justifyContent: item.meta ? 'space-between' : 'flex-start',
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
                            {item.meta ? (
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {item.meta}
                              </Typography>
                            ) : null}
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

              <Stack
                spacing={3}
                sx={{
                  '& .MuiTableContainer-root': {
                    overflowX: 'auto',
                  },
                }}
              >
              <Paper elevation={0} sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2.5, backgroundColor: '#e9f3ef', border: '1px solid #d5e6df' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {navIconByView[viewMode]}
                    <Typography variant="body2">Panel / {viewTitle}</Typography>
                  </Stack>
                  <Chip label={user ? roleLabels[user.role] : 'Sin rol'} size="small" />
                </Stack>
              </Paper>

              {user?.role === 'manager' && (
                <Paper elevation={0} sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2.5, backgroundColor: '#f4faf7', border: '1px solid #d5e6df' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Organización asignada: {activeConsorcio?.nombre ?? 'Sin organización asignada'}
                    </Typography>
                    {activeConsorcio?.tipo && (
                      <Chip size="small" variant="outlined" label={`Tipo: ${consorcioTipoLabels[activeConsorcio.tipo]}`} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Módulos: {activeConsorcio?.modulos?.length ? activeConsorcio.modulos.map((m) => moduloLabels[m]).join(', ') : 'No configurados'}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              {user?.role === 'admin' && viewMode === 'admin' && (
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 12px 28px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                          <Box>
                            <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.1 }}>
                              Administración
                            </Typography>
                            <Typography variant="h6">Organizaciones</Typography>
                            <Typography color="text.secondary">
                              Clientes registrados en la plataforma.
                            </Typography>
                          </Box>
                          <Button variant="contained" onClick={handleOpenCreateConsorcio} disabled={isSubmitting}>
                            Nuevo
                          </Button>
                        </Stack>

                        {consorcios.length === 0 ? (
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f6f7f8' }}>
                            <Typography color="text.secondary">Aún no hay organizaciones creadas.</Typography>
                          </Paper>
                        ) : (
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                  <TableCell>Nombre</TableCell>
                                  <TableCell>Tipo</TableCell>
                                  <TableCell>Dirección</TableCell>
                                  <TableCell>Módulos</TableCell>
                                  <TableCell>Estado</TableCell>
                                  <TableCell>Acciones</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {consorcios.map((consorcio) => (
                                  <TableRow key={consorcio.id} sx={{ opacity: consorcio.activo === false ? 0.55 : 1 }}>
                                    <TableCell>{consorcio.nombre}</TableCell>
                                    <TableCell>{consorcioTipoLabels[consorcio.tipo]}</TableCell>
                                    <TableCell>{consorcio.direccion}</TableCell>
                                    <TableCell>
                                      {consorcio.modulos?.map((m) => moduloLabels[m]).join(', ') ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        size="small"
                                        label={consorcio.activo === false ? 'Inactiva' : 'Activa'}
                                        color={consorcio.activo === false ? 'default' : 'success'}
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={1}>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleOpenEditConsorcio(consorcio)}
                                          disabled={isSubmitting}
                                        >
                                          Editar
                                        </Button>
                                        <Button
                                          size="small"
                                          color={consorcio.activo === false ? 'success' : 'warning'}
                                          variant="outlined"
                                          onClick={() => handleToggleConsorcioActivo(consorcio)}
                                          disabled={isSubmitting}
                                        >
                                          {consorcio.activo === false ? 'Activar' : 'Desactivar'}
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
                          <Button variant="contained" size="small" onClick={handleOpenCreateOwner} disabled={isSubmitting} sx={{ width: { xs: '100%', sm: 'auto' } }}>
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
                <strong>Rol actual:</strong> {user ? roleLabels[user.role] : 'Sin rol'}. {managerHasConsorcioModule
                  ? (
                    <>Ahora la generación de expensas liquida por <strong>unidad</strong> y permite criterio por <strong>coeficiente</strong> o <strong>m2</strong>.</>
                  )
                  : (
                    <>Gestionas alquileres de la organización asignada sin acceso a módulos de expensas.</>
                  )}
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
                              <Button variant="contained" size="small" onClick={openModuleForm} sx={{ width: { xs: '100%', sm: 'auto' } }}>
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

                {viewMode === 'unidades' && user?.role === 'manager' && managerHasConsorcioModule && (
                  <Card sx={{ mt: 2, borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 14px 34px rgba(0,0,0,0.06)' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                          <Box>
                            <Typography variant="h6">Propietarios</Typography>
                            <Typography color="text.secondary">
                              Alta y edición de propietarios de este consorcio.
                            </Typography>
                          </Box>
                          <Button variant="contained" size="small" onClick={handleOpenCreateOwner} disabled={isSubmitting} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            Nuevo
                          </Button>
                        </Stack>

                        {owners.length === 0 ? (
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f6f7f8' }}>
                            <Typography color="text.secondary">Aún no hay propietarios cargados.</Typography>
                          </Paper>
                        ) : (
                          <>
                            <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                              {owners.map((owner) => {
                                const assignedUnidad = unidades.find((u) => u.propietarioId === owner.id);
                                return (
                                  <Paper key={`owner-card-${owner.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Stack spacing={0.6}>
                                      <Typography variant="subtitle2">{owner.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">{owner.email}</Typography>
                                      {owner.phoneNumber && (
                                        <Typography variant="caption" color="text.secondary">WhatsApp: {owner.phoneNumber}</Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary">
                                        Unidad: {assignedUnidad ? assignedUnidad.numero : 'Sin asignar'}
                                      </Typography>
                                      <Stack direction="row" spacing={1}>
                                        <Button size="small" variant="outlined" onClick={() => handleStartEditOwner(owner)} disabled={isSubmitting}>Editar</Button>
                                        <Button size="small" color="error" onClick={() => handleDeleteOwner(owner)} disabled={isSubmitting}>Eliminar</Button>
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                );
                              })}
                            </Stack>

                            <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                              <Table size="small" sx={{ minWidth: 640 }}>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>WhatsApp</TableCell>
                                    <TableCell>Unidad asignada</TableCell>
                                    <TableCell>Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {owners.map((owner) => {
                                    const assignedUnidad = unidades.find((u) => u.propietarioId === owner.id);
                                    return (
                                      <TableRow key={owner.id}>
                                        <TableCell>{owner.name}</TableCell>
                                        <TableCell>{owner.email}</TableCell>
                                        <TableCell>{owner.phoneNumber || '—'}</TableCell>
                                        <TableCell>{assignedUnidad ? assignedUnidad.numero : 'Sin asignar'}</TableCell>
                                        <TableCell>
                                          <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="outlined" onClick={() => handleStartEditOwner(owner)} disabled={isSubmitting}>
                                              Editar
                                            </Button>
                                            <Button size="small" color="error" onClick={() => handleDeleteOwner(owner)} disabled={isSubmitting}>
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
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

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
                      label="Nombre"
                      value={unidadEditForm.nombre}
                      onChange={(event) =>
                        setUnidadEditForm((current) => ({ ...current, nombre: event.target.value }))
                      }
                      fullWidth
                    />
                    {activeConsorcioIsConsorcioType ? (
                      <TextField
                        label="Tipo de propiedad"
                        value={tipoPropiedadLabels[unidadEditForm.tipo]}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        helperText="Fijo para organizaciones de tipo consorcio"
                      />
                    ) : (
                      <TextField
                        select
                        label="Tipo de propiedad"
                        value={unidadEditForm.tipo}
                        onChange={(event) =>
                          setUnidadEditForm((current) => ({ ...current, tipo: event.target.value as TipoPropiedad }))
                        }
                        fullWidth
                      >
                        {(Object.keys(tipoPropiedadLabels) as TipoPropiedad[]).map((tipo) => (
                          <MenuItem key={tipo} value={tipo}>
                            {tipoPropiedadLabels[tipo]}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
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
                      label="Organización"
                      value={ownerEditForm.consorcioId}
                      onChange={(event) =>
                        setOwnerEditForm((current) => ({
                          ...current,
                          consorcioId: event.target.value,
                          unidadId: '',
                        }))
                      }
                      fullWidth
                      disabled={user?.role === 'manager'}
                      helperText={
                        user?.role === 'manager'
                          ? 'Como manager, solo puedes operar sobre tu organización asignada'
                          : 'Requerido cuando el propietario no tiene unidad asignada'
                      }
                    >
                      {user?.role !== 'manager' && <MenuItem value="">Seleccionar organización</MenuItem>}
                      {consorcios
                        .filter((c) => c.tipo === 'consorcio' || c.tipo === 'propietario_individual')
                        .map((consorcio) => (
                          <MenuItem key={consorcio.id} value={consorcio.id}>
                            {consorcio.nombre}
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      select
                      label="Unidad asignada"
                      value={ownerEditForm.unidadId}
                      onChange={(event) => {
                        const nextUnidadId = event.target.value;
                        const selectedUnidad = unidades.find((unidad) => unidad.id === nextUnidadId);
                        setOwnerEditForm((current) => ({
                          ...current,
                          unidadId: nextUnidadId,
                          consorcioId: selectedUnidad?.consorcioId ?? current.consorcioId,
                        }));
                      }}
                      fullWidth
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {unidades
                        .filter(
                          (unidad) =>
                            (!ownerEditForm.consorcioId || unidad.consorcioId === ownerEditForm.consorcioId) &&
                            (!unidad.propietarioId || (editingOwnerId ? unidad.propietarioId === editingOwnerId : false)),
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
                      !ownerEditForm.consorcioId ||
                      (!editingOwnerId && ownerEditForm.password.length < 6) ||
                      (Boolean(editingOwnerId) && ownerEditForm.password.length > 0 && ownerEditForm.password.length < 6)
                    }
                  >
                    Guardar cambios
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={consorcioModalOpen}
                onClose={() => setConsorcioModalOpen(false)}
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
                  {editingConsorcioId ? 'Editar organización' : 'Nueva organización'}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      select
                      label="Tipo de cliente"
                      value={consorcioForm.tipo}
                      onChange={(event) => applyConsorcioTipoPreset(event.target.value as ConsorcioTipo)}
                      fullWidth
                    >
                      {(Object.keys(consorcioTipoLabels) as ConsorcioTipo[]).map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>{consorcioTipoLabels[tipo]}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Nombre"
                      value={consorcioForm.nombre}
                      onChange={(event) => setConsorcioForm((current) => ({ ...current, nombre: event.target.value }))}
                      fullWidth
                      autoFocus
                    />
                    <TextField
                      label="Dirección"
                      value={consorcioForm.direccion}
                      onChange={(event) => setConsorcioForm((current) => ({ ...current, direccion: event.target.value }))}
                      fullWidth
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Módulos habilitados</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {(Object.keys(moduloLabels) as ModuloHabilitado[]).map((modulo) => {
                          const active = consorcioForm.modulos.includes(modulo);
                          return (
                            <Chip
                              key={`dlg-modulo-${modulo}`}
                              label={moduloLabels[modulo]}
                              color={active ? 'primary' : 'default'}
                              variant={active ? 'filled' : 'outlined'}
                              onClick={() => toggleConsorcioModulo(modulo)}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button onClick={() => setConsorcioModalOpen(false)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateConsorcio}
                    disabled={
                      isSubmitting ||
                      !consorcioForm.nombre.trim() ||
                      !consorcioForm.direccion.trim() ||
                      consorcioForm.modulos.length === 0
                    }
                  >
                    {editingConsorcioId ? 'Guardar cambios' : 'Crear'}
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
                          {user?.role === 'tenant' ? 'Portal Inquilino' : 'Portal Propietario'}
                        </Typography>
                        <Typography variant="h5">
                          {user?.role === 'tenant' ? 'Mi alquiler del mes y pagos' : 'Mi expensa del mes y pagos'}
                        </Typography>
                        <Typography color="text.secondary">
                          {user?.role === 'tenant'
                            ? 'Aquí el inquilino visualiza sus alquileres por período y puede consultar sus pagos de alquiler.'
                            : 'Aquí el propietario visualiza sus expensas por período, ve el detalle para PDF y puede pagar online o reportar pago manual.'}
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
                        <Alert severity="info">
                          {user?.role === 'tenant'
                            ? 'No tienes alquileres disponibles todavía.'
                            : 'No tienes expensas disponibles todavía.'}
                        </Alert>
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
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {user?.role === 'tenant' ? 'Mis últimos pagos de alquiler' : 'Mis últimos pagos'}
                        </Typography>
                        {latestOwnerPayments.length === 0 ? (
                          <Alert severity="info">
                            {user?.role === 'tenant'
                              ? 'Aún no registraste pagos de alquiler.'
                              : 'Aún no registraste pagos.'}
                          </Alert>
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

              <Fade in={viewMode === 'alquiler'} mountOnEnter unmountOnExit timeout={220}>
                <Stack spacing={3}>
                  {/* ── ABM de Inquilinos (solo admin/manager) ── */}
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <Card sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                            <Box>
                              <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                                Inquilinos
                              </Typography>
                              <Typography variant="h6">Gestión de inquilinos</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Registra los inquilinos antes de crear contratos de alquiler.
                              </Typography>
                            </Box>
                            <Button variant="contained" size="small" onClick={() => handleOpenInquilinoDialog()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                              + Nuevo inquilino
                            </Button>
                          </Stack>

                          {inquilinos.length === 0 ? (
                            <Alert severity="warning">
                              No hay inquilinos registrados. Crea uno para poder asignarlo a un contrato.
                            </Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {inquilinos.map((inq) => (
                                  <Paper key={`inquilino-card-${inq.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Stack spacing={0.75}>
                                      <Typography variant="subtitle2">{inq.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">Email: {inq.email}</Typography>
                                      <Typography variant="caption" color="text.secondary">Teléfono: {inq.phoneNumber ?? '-'}</Typography>
                                      {user?.role === 'admin' && (
                                        <Typography variant="caption" color="text.secondary">
                                          Consorcio: {consorcios.find((c) => c.id === inq.consorcioId)?.nombre ?? inq.consorcioId?.slice(0, 8) ?? '-'}
                                        </Typography>
                                      )}
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Button size="small" variant="outlined" onClick={() => handleOpenInquilinoDialog(inq)}>
                                          Editar
                                        </Button>
                                        <Button size="small" variant="outlined" color="error" onClick={() => handleRemoveInquilino(inq.id)}>
                                          Eliminar
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
                                      <TableCell>Nombre</TableCell>
                                      <TableCell>Email</TableCell>
                                      <TableCell>Teléfono</TableCell>
                                      {user?.role === 'admin' && <TableCell>Consorcio</TableCell>}
                                      <TableCell>Acciones</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {inquilinos.map((inq) => (
                                      <TableRow key={inq.id}>
                                        <TableCell>{inq.name}</TableCell>
                                        <TableCell>{inq.email}</TableCell>
                                        <TableCell>{inq.phoneNumber ?? '-'}</TableCell>
                                        {user?.role === 'admin' && (
                                          <TableCell>
                                            {consorcios.find((c) => c.id === inq.consorcioId)?.nombre ?? inq.consorcioId?.slice(0, 8) ?? '-'}
                                          </TableCell>
                                        )}
                                        <TableCell>
                                          <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="outlined" onClick={() => handleOpenInquilinoDialog(inq)}>
                                              Editar
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="error"
                                              onClick={() => handleRemoveInquilino(inq.id)}
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
                            </>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Contratos de alquiler (solo admin/manager) ── */}
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <Card sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                            <Box>
                              <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                                Contratos de alquiler
                              </Typography>
                              <Typography variant="h6">Contratos activos</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Gestiona los contratos vigentes: inquilino, unidad, monto mensual y día de vencimiento.
                              </Typography>
                            </Box>
                            <Button variant="contained" size="small" onClick={() => handleOpenContratoDialog()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                              + Nuevo contrato
                            </Button>
                          </Stack>

                          {contratos.length === 0 ? (
                            <Alert severity="info">No hay contratos activos. Crea el primero para comenzar a generar alquileres.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {contratos.map((contrato) => (
                                  <Paper key={`contrato-card-${contrato.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Stack spacing={0.75}>
                                      <Typography variant="subtitle2">Unidad {contrato.unidad?.numero ?? contrato.unidadId.slice(0, 8)}</Typography>
                                      <Typography variant="caption" color="text.secondary">Inquilino: {contrato.inquilino?.name ?? contrato.inquilinoId.slice(0, 8)}</Typography>
                                      <Typography variant="caption" color="text.secondary">Monto: {formatMoney(contrato.montoMensual)}</Typography>
                                      <Typography variant="caption" color="text.secondary">Vencimiento: día {contrato.diaVencimiento}</Typography>
                                      <Box>
                                        <Chip label={contrato.activo ? 'Activo' : 'Inactivo'} color={contrato.activo ? 'success' : 'default'} size="small" />
                                      </Box>
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {contrato.contratoDigitalUrl ? (
                                          <Button size="small" variant="text" onClick={() => handleOpenComprobante(contrato.contratoDigitalUrl ?? null)}>
                                            Ver archivo
                                          </Button>
                                        ) : null}
                                        <Button size="small" variant="outlined" onClick={() => handleOpenContratoDialog(contrato)}>
                                          Editar
                                        </Button>
                                        {contrato.activo && (
                                          <Button size="small" variant="outlined" color="error" onClick={() => handleDeactivateContrato(contrato.id)}>
                                            Desactivar
                                          </Button>
                                        )}
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Table size="small">
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Unidad</TableCell>
                                      <TableCell>Inquilino</TableCell>
                                      <TableCell align="right">Monto mensual</TableCell>
                                      <TableCell>Día venc.</TableCell>
                                      <TableCell>Contrato digital</TableCell>
                                      <TableCell>Estado</TableCell>
                                      <TableCell>Acciones</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {contratos.map((contrato) => (
                                      <TableRow key={contrato.id}>
                                        <TableCell>{contrato.unidad?.numero ?? contrato.unidadId.slice(0, 8)}</TableCell>
                                        <TableCell>{contrato.inquilino?.name ?? contrato.inquilinoId.slice(0, 8)}</TableCell>
                                        <TableCell align="right">{formatMoney(contrato.montoMensual)}</TableCell>
                                        <TableCell>{contrato.diaVencimiento}</TableCell>
                                        <TableCell>
                                          {contrato.contratoDigitalUrl ? (
                                            <Button
                                              size="small"
                                              variant="text"
                                              onClick={() => handleOpenComprobante(contrato.contratoDigitalUrl ?? null)}
                                            >
                                              Ver archivo
                                            </Button>
                                          ) : (
                                            'Sin archivo'
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={contrato.activo ? 'Activo' : 'Inactivo'}
                                            color={contrato.activo ? 'success' : 'default'}
                                            size="small"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="outlined" onClick={() => handleOpenContratoDialog(contrato)}>
                                              Editar
                                            </Button>
                                            {contrato.activo && (
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleDeactivateContrato(contrato.id)}
                                              >
                                                Desactivar
                                              </Button>
                                            )}
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Generación y seguimiento mensual ── */}
                  <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Stack spacing={2.5}>
                        <Box>
                          <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                            Alquileres
                          </Typography>
                          <Typography variant="h5">
                            {user?.role === 'tenant' ? 'Mi alquiler' : 'Liquidación mensual'}
                          </Typography>
                          <Typography color="text.secondary">
                            {user?.role === 'tenant'
                              ? 'Consulta tus alquileres mensuales y registra el pago.'
                              : 'Genera alquileres del período, registra pagos y envía recordatorios de cobranza.'}
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
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <>
                              <Button
                                variant="contained"
                                onClick={handleGenerarAlquileres}
                                disabled={alquilerGeneracionLoading || !reportePeriodo || (user?.role === 'admin' && !reporteConsorcioId)}
                                sx={{ width: { xs: '100%', md: 'auto' } }}
                              >
                                {alquilerGeneracionLoading ? 'Generando...' : 'Generar alquileres'}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={handleRecordarAlquileres}
                                disabled={alquilerReminderLoading || !reportePeriodo || (user?.role === 'admin' && !reporteConsorcioId)}
                                sx={{ width: { xs: '100%', md: 'auto' } }}
                              >
                                {alquilerReminderLoading ? 'Enviando...' : 'Recordar pendientes'}
                              </Button>
                            </>
                          )}
                        </Stack>

                        {alquilerResultado && (
                          <Alert severity="success">
                            Alquileres {alquilerResultado.periodo}: generados {alquilerResultado.generados}, ya existentes {alquilerResultado.existentes}. Contratos activos: {alquilerResultado.contratosActivos}.
                          </Alert>
                        )}

                        {alquilerReminderResultado && (
                          <Alert severity="success">
                            Se enviaron {alquilerReminderResultado.recordatoriosGenerados} recordatorios ({alquilerReminderResultado.periodo}) por {alquilerReminderResultado.proveedor}.
                          </Alert>
                        )}

                        {alquileres.length === 0 ? (
                          <Alert severity="info">No hay alquileres para el filtro actual. Generá los del período con el botón de arriba.</Alert>
                        ) : (
                          <>
                            <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                              {alquileres.map((alquiler) => (
                                <Paper key={`alquiler-card-${alquiler.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                  <Stack spacing={0.75}>
                                    <Typography variant="subtitle2">Período {alquiler.periodo}</Typography>
                                    <Typography variant="caption" color="text.secondary">Unidad: {alquiler.unidad?.numero ?? alquiler.unidadId.slice(0, 8)}</Typography>
                                    <Typography variant="caption" color="text.secondary">Monto: {formatMoney(alquiler.monto)}</Typography>
                                    <Typography variant="caption" color="text.secondary">Método: {alquiler.metodo ?? '-'}</Typography>
                                    <Typography variant="caption" color="text.secondary">Vence: {new Date(alquiler.fechaVencimiento).toLocaleDateString('es-AR')}</Typography>
                                    <Box>
                                      <Chip
                                        label={alquiler.estado}
                                        size="small"
                                        color={alquiler.estado === 'aprobado' ? 'success' : alquiler.estado === 'vencido' ? 'error' : 'warning'}
                                      />
                                    </Box>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                      {alquiler.estado !== 'aprobado' && (
                                        <Button size="small" variant="contained" onClick={() => handlePagarAlquilerOnline(alquiler)}>
                                          Pagar online
                                        </Button>
                                      )}
                                      {(user?.role === 'admin' || user?.role === 'manager') && alquiler.estado !== 'aprobado' && (
                                        <Button size="small" variant="outlined" onClick={() => handleRegistrarPagoAlquilerManual(alquiler.id)}>
                                          Manual
                                        </Button>
                                      )}
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
                                    <TableCell align="right">Monto</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Método</TableCell>
                                    <TableCell>Vencimiento</TableCell>
                                    <TableCell>Acciones</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {alquileres.map((alquiler) => (
                                    <TableRow key={alquiler.id}>
                                      <TableCell>{alquiler.periodo}</TableCell>
                                      <TableCell>{alquiler.unidad?.numero ?? alquiler.unidadId.slice(0, 8)}</TableCell>
                                      <TableCell align="right">{formatMoney(alquiler.monto)}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={alquiler.estado}
                                          size="small"
                                          color={alquiler.estado === 'aprobado' ? 'success' : alquiler.estado === 'vencido' ? 'error' : 'warning'}
                                        />
                                      </TableCell>
                                      <TableCell>{alquiler.metodo ?? '-'}</TableCell>
                                      <TableCell>{new Date(alquiler.fechaVencimiento).toLocaleDateString('es-AR')}</TableCell>
                                      <TableCell>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                          {alquiler.estado !== 'aprobado' && (
                                            <Button size="small" variant="contained" onClick={() => handlePagarAlquilerOnline(alquiler)}>
                                              Pagar online
                                            </Button>
                                          )}
                                          {(user?.role === 'admin' || user?.role === 'manager') && alquiler.estado !== 'aprobado' && (
                                            <Button size="small" variant="outlined" onClick={() => handleRegistrarPagoAlquilerManual(alquiler.id)}>
                                              Manual
                                            </Button>
                                          )}
                                        </Stack>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Fade>

              {/* ── Dialog: Crear / Editar Contrato ── */}
              <Dialog open={contratoDialogOpen} onClose={() => setContratoDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  {editContratoId ? 'Editar contrato de alquiler' : 'Nuevo contrato de alquiler'}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 2 }}>
                    {user?.role === 'admin' && !editContratoId && (
                      <TextField
                        select
                        label="Consorcio"
                        value={contratoForm.consorcioId}
                        onChange={(e) => setContratoForm((prev) => ({ ...prev, consorcioId: e.target.value, unidadId: '' }))}
                        fullWidth
                        required
                      >
                        {consorcios.map((c) => (
                          <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                        ))}
                      </TextField>
                    )}
                    {!editContratoId && (
                      <TextField
                        select
                        label="Unidad"
                        value={contratoForm.unidadId}
                        onChange={(e) => setContratoForm((prev) => ({ ...prev, unidadId: e.target.value }))}
                        fullWidth
                        required
                      >
                        {unidades
                          .filter((u) => !contratoForm.consorcioId || u.consorcioId === contratoForm.consorcioId)
                          .map((u) => (
                            <MenuItem key={u.id} value={u.id}>{u.numero}</MenuItem>
                          ))}
                      </TextField>
                    )}
                    <TextField
                      select
                      label="Inquilino"
                      value={contratoForm.inquilinoId}
                      onChange={(e) => setContratoForm((prev) => ({ ...prev, inquilinoId: e.target.value }))}
                      fullWidth
                      required
                    >
                      {inquilinos.length === 0 ? (
                        <MenuItem value="" disabled>No hay inquilinos registrados</MenuItem>
                      ) : (
                        inquilinos.map((inq) => (
                          <MenuItem key={inq.id} value={inq.id}>{inq.name} — {inq.email}</MenuItem>
                        ))
                      )}
                    </TextField>
                    <TextField
                      label="Monto mensual"
                      type="number"
                      value={contratoForm.montoMensual}
                      onChange={(e) => setContratoForm((prev) => ({ ...prev, montoMensual: e.target.value }))}
                      fullWidth
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                    />
                    <TextField
                      label="Día de vencimiento (1-31)"
                      type="number"
                      value={contratoForm.diaVencimiento}
                      onChange={(e) => setContratoForm((prev) => ({ ...prev, diaVencimiento: e.target.value }))}
                      fullWidth
                      required
                      inputProps={{ min: 1, max: 31, step: 1 }}
                    />
                    <TextField
                      type="file"
                      label="Contrato digital (PDF, DOC o DOCX)"
                      inputProps={{ accept: '.pdf,.doc,.docx' }}
                      onChange={(event) => {
                        const selected = (event.target as HTMLInputElement).files?.[0] ?? null;
                        setContratoDigitalFile(selected);
                      }}
                      fullWidth
                      helperText={editContratoId ? 'Opcional: adjunta un archivo para reemplazar el contrato actual.' : 'Opcional: adjunta el archivo digital del contrato.'}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button onClick={() => setContratoDialogOpen(false)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveContrato}
                    disabled={
                      !contratoForm.inquilinoId ||
                      !contratoForm.montoMensual ||
                      !contratoForm.diaVencimiento ||
                      (!editContratoId && (!contratoForm.unidadId))
                    }
                  >
                    {editContratoId ? 'Guardar cambios' : 'Crear contrato'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* ── Dialog: Crear / Editar Inquilino ── */}
              <Dialog open={inquilinoDialogOpen} onClose={() => setInquilinoDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ backgroundColor: '#e7f3ef', borderBottom: '1px solid #c9dfd7' }}>
                  {editInquilinoId ? 'Editar inquilino' : 'Nuevo inquilino'}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 2 }}>
                    {user?.role === 'admin' && !editInquilinoId && (
                      <TextField
                        select
                        label="Consorcio"
                        value={inquilinoForm.consorcioId}
                        onChange={(e) => setInquilinoForm((prev) => ({ ...prev, consorcioId: e.target.value }))}
                        fullWidth
                        required
                      >
                        {consorcios.map((c) => (
                          <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                        ))}
                      </TextField>
                    )}
                    <TextField
                      label="Nombre completo"
                      value={inquilinoForm.name}
                      onChange={(e) => setInquilinoForm((prev) => ({ ...prev, name: e.target.value }))}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={inquilinoForm.email}
                      onChange={(e) => setInquilinoForm((prev) => ({ ...prev, email: e.target.value }))}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Teléfono (opcional)"
                      value={inquilinoForm.phoneNumber}
                      onChange={(e) => setInquilinoForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      fullWidth
                      placeholder="+54 11 1234-5678"
                    />
                    <TextField
                      label={editInquilinoId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                      type="password"
                      value={inquilinoForm.password}
                      onChange={(e) => setInquilinoForm((prev) => ({ ...prev, password: e.target.value }))}
                      fullWidth
                      required={!editInquilinoId}
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button onClick={() => setInquilinoDialogOpen(false)}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveInquilino}
                    disabled={
                      !inquilinoForm.name ||
                      !inquilinoForm.email ||
                      (!editInquilinoId && !inquilinoForm.password) ||
                      (!editInquilinoId && user?.role === 'admin' && !inquilinoForm.consorcioId)
                    }
                  >
                    {editInquilinoId ? 'Guardar cambios' : 'Crear inquilino'}
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={gastoExtraDialogOpen}
                onClose={() => {
                  setGastoExtraDialogOpen(false);
                  setEditingGastoExtraId(null);
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
                  {editingGastoExtraId ? 'Editar gasto extra' : 'Nuevo gasto extra'}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    {user?.role === 'admin' && (
                      <TextField
                        select
                        label="Organización"
                        value={gastoExtraForm.consorcioId}
                        onChange={(event) =>
                          setGastoExtraForm((current) => ({
                            ...current,
                            consorcioId: event.target.value,
                            unidadId: '',
                          }))
                        }
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
                      select
                      label="Unidad"
                      value={gastoExtraForm.unidadId}
                      onChange={(event) =>
                        setGastoExtraForm((current) => ({ ...current, unidadId: event.target.value }))
                      }
                      fullWidth
                    >
                      {unidades
                        .filter((unidad) => !gastoExtraForm.consorcioId || unidad.consorcioId === gastoExtraForm.consorcioId)
                        .map((unidad) => (
                          <MenuItem key={unidad.id} value={unidad.id}>
                            {unidad.numero}
                          </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                      label="Descripción"
                      value={gastoExtraForm.descripcion}
                      onChange={(event) =>
                        setGastoExtraForm((current) => ({ ...current, descripcion: event.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={gastoExtraForm.cantidad}
                      onChange={(event) =>
                        setGastoExtraForm((current) => ({ ...current, cantidad: event.target.value }))
                      }
                      inputProps={{ min: 0.01, step: 0.01 }}
                      fullWidth
                    />
                    <TextField
                      label="Fecha"
                      type="date"
                      value={gastoExtraForm.fecha}
                      onChange={(event) =>
                        setGastoExtraForm((current) => ({ ...current, fecha: event.target.value }))
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #c9dfd7', backgroundColor: '#f5faf8' }}>
                  <Button
                    onClick={() => {
                      setGastoExtraDialogOpen(false);
                      setEditingGastoExtraId(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveGastoExtra}
                    disabled={
                      !gastoExtraForm.consorcioId ||
                      !gastoExtraForm.unidadId ||
                      !gastoExtraForm.descripcion.trim() ||
                      !gastoExtraForm.fecha ||
                      Number.isNaN(Number(gastoExtraForm.cantidad)) ||
                      Number(gastoExtraForm.cantidad) <= 0
                    }
                  >
                    {editingGastoExtraId ? 'Guardar cambios' : 'Crear gasto extra'}
                  </Button>
                </DialogActions>
              </Dialog>

              <Fade in={viewMode === 'gastosExtras'} mountOnEnter unmountOnExit timeout={220}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2}>
                        <Box>
                          <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                            Gastos extras
                          </Typography>
                          <Typography variant="h5">Registro por unidad</Typography>
                          <Typography color="text.secondary">
                            Carga gastos extras por unidad con cantidad, fecha y descripción.
                          </Typography>
                        </Box>
                        <Button variant="contained" onClick={handleOpenCreateGastoExtra}>
                          Nuevo gasto extra
                        </Button>
                      </Stack>

                      {gastosExtras.length === 0 ? (
                        <Alert severity="info">Aún no hay gastos extras cargados.</Alert>
                      ) : (
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableRow>
                                <TableCell>Unidad</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell>Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {gastosExtras.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.unidad?.numero ?? unidades.find((u) => u.id === item.unidadId)?.numero ?? item.unidadId.slice(0, 8)}</TableCell>
                                  <TableCell>{item.descripcion}</TableCell>
                                  <TableCell>{new Date(item.fecha).toLocaleDateString('es-AR')}</TableCell>
                                  <TableCell align="right">{formatMoney(item.cantidad)}</TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={1}>
                                      <Button size="small" variant="outlined" onClick={() => handleStartEditGastoExtra(item)}>Editar</Button>
                                      <Button size="small" color="error" onClick={() => handleDeleteGastoExtra(item.id)}>Eliminar</Button>
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
              </Fade>

              <Fade in={viewMode === 'reportes'} mountOnEnter unmountOnExit timeout={220}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>
                          Reportes
                        </Typography>
                        <Typography variant="h5">Resumen mensual de la organización</Typography>
                        <Typography color="text.secondary">
                          {reporteHasAlquileresModule && !reporteHasConsorcioModule
                            ? 'Consulta contratos activos, gastos extras y pagos de alquiler del período.'
                            : 'Consulta totales de gastos, expensas emitidas y pagos registrados por período.'}
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
                          sx={{ width: { xs: '100%', md: 'auto' } }}
                        >
                          {reporteLoading ? 'Consultando...' : 'Consultar'}
                        </Button>
                      </Stack>

                      {reporteResumen ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
                          <Paper sx={{ p: { xs: 1.5, sm: 1.75 }, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule ? 'Gastos extras' : 'Gastos'}
                            </Typography>
                            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{formatMoney(reporteResumen.totalGastos)}</Typography>
                          </Paper>
                          <Paper sx={{ p: { xs: 1.5, sm: 1.75 }, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule ? 'Contratos activos' : 'Expensas emitidas'}
                            </Typography>
                            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule
                                ? String(reporteResumen.contratosActivos ?? 0)
                                : formatMoney(reporteResumen.totalExpensas)}
                            </Typography>
                          </Paper>
                          <Paper sx={{ p: { xs: 1.5, sm: 1.75 }, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule ? 'Pagos de alquiler' : 'Pagos registrados'}
                            </Typography>
                            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule
                                ? formatMoney(reporteResumen.totalPagosAlquiler ?? 0)
                                : formatMoney(reporteResumen.totalPagos)}
                            </Typography>
                          </Paper>
                          <Paper sx={{ p: { xs: 1.5, sm: 1.75 }, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule
                                ? `Saldo alquiler (${reporteResumen.periodo})`
                                : `Saldo (${reporteResumen.periodo})`}
                            </Typography>
                            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                              {reporteHasAlquileresModule && !reporteHasConsorcioModule
                                ? formatMoney((reporteResumen.totalAlquileresPeriodo ?? 0) - (reporteResumen.totalPagosAlquiler ?? 0))
                                : formatMoney(reporteResumen.totalExpensas - reporteResumen.totalPagos)}
                            </Typography>
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
                          {canManageIntegraciones ? 'Configuración' : 'Recordatorios'}
                        </Typography>
                        <Typography variant="h5">
                          {canManageIntegraciones ? 'Integraciones, WhatsApp y notificaciones' : 'Recordatorios de la organización'}
                        </Typography>
                        <Typography color="text.secondary">
                          {canManageIntegraciones
                            ? 'Gestiona claves por consorcio y valida envíos desde un panel administrativo.'
                            : 'Envía recordatorios de pagos pendientes para tu organización.'}
                        </Typography>
                      </Box>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        {canManageIntegraciones && (
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
                          variant="outlined"
                          onClick={handleSendPendingReminders}
                          disabled={
                            recordatorioLoading ||
                            !reportePeriodo ||
                            (canManageIntegraciones && !reporteConsorcioId)
                          }
                          sx={{ width: { xs: '100%', md: 'auto' } }}
                        >
                          {recordatorioLoading ? 'Enviando...' : 'Recordar pendientes'}
                        </Button>
                      </Stack>

                      {recordatorioResultado && (
                        <Alert severity="success">
                          Se generaron {recordatorioResultado.recordatoriosGenerados} recordatorios de pago ({recordatorioResultado.periodo}) por {recordatorioResultado.proveedor}.
                        </Alert>
                      )}

                      {canManageIntegraciones && (
                        <>
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
                              sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                                  sx={{ width: { xs: '100%', md: 'auto' } }}
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
                              sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                              sx={{ width: { xs: '100%', md: 'auto' } }}
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
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>

              <Fade in={viewMode === 'data'} mountOnEnter unmountOnExit timeout={220}>
                <Card sx={{ borderRadius: 4, border: '1px solid #d7e5df', boxShadow: '0 14px 34px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#005f73', letterSpacing: 1.2 }}>Módulo</Typography>
                        <Typography variant="h5" sx={{ mb: 1 }}>Tablas y registros</Typography>
                      </Box>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: { xs: 'block', md: 'none' }, pb: 1.2 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              mb: 1.2,
                              p: 1.2,
                              borderRadius: 2,
                              border: '1px solid #dce9e4',
                              backgroundColor: '#f7fbf9',
                            }}
                          >
                            <Stack spacing={1}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Sección activa
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {dataTabLabels[AVAILABLE_DATA_TABS.includes(dataTab) ? dataTab : AVAILABLE_DATA_TABS[0]]}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.8} sx={{ overflowX: 'auto', pb: 0.3 }}>
                                {AVAILABLE_DATA_TABS.map((tab) => (
                                  <Chip
                                    key={`data-tab-chip-${tab}`}
                                    label={`${dataTabLabels[tab]} (${dataTabCounts[tab]})`}
                                    size="small"
                                    color={dataTab === tab ? 'primary' : 'default'}
                                    variant={dataTab === tab ? 'filled' : 'outlined'}
                                    onClick={() => setDataTab(tab)}
                                    sx={{ flexShrink: 0 }}
                                  />
                                ))}
                              </Stack>
                            </Stack>
                          </Paper>

                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Sección"
                            value={AVAILABLE_DATA_TABS.includes(dataTab) ? dataTab : AVAILABLE_DATA_TABS[0]}
                            onChange={(event) => setDataTab(event.target.value as DataTab)}
                          >
                            {AVAILABLE_DATA_TABS.includes('consorcios') && (
                              <MenuItem value="consorcios">{dataTabLabels.consorcios} ({dataTabCounts.consorcios})</MenuItem>
                            )}
                            {AVAILABLE_DATA_TABS.includes('unidades') && (
                              <MenuItem value="unidades">{dataTabLabels.unidades} ({dataTabCounts.unidades})</MenuItem>
                            )}
                            {AVAILABLE_DATA_TABS.includes('gastos') && (
                              <MenuItem value="gastos">{dataTabLabels.gastos} ({dataTabCounts.gastos})</MenuItem>
                            )}
                            {AVAILABLE_DATA_TABS.includes('gastosExtras') && (
                              <MenuItem value="gastosExtras">{dataTabLabels.gastosExtras} ({dataTabCounts.gastosExtras})</MenuItem>
                            )}
                            {AVAILABLE_DATA_TABS.includes('expensas') && (
                              <MenuItem value="expensas">{dataTabLabels.expensas} ({dataTabCounts.expensas})</MenuItem>
                            )}
                            {AVAILABLE_DATA_TABS.includes('pagos') && (
                              <MenuItem value="pagos">{dataTabLabels.pagos} ({dataTabCounts.pagos})</MenuItem>
                            )}
                          </TextField>
                        </Box>

                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Tabs
                            value={AVAILABLE_DATA_TABS.includes(dataTab) ? dataTab : AVAILABLE_DATA_TABS[0]}
                            onChange={(_event, value: DataTab) => setDataTab(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            aria-label="Pestañas de tablas y registros"
                          >
                            {AVAILABLE_DATA_TABS.includes('consorcios') && (
                              <Tab value="consorcios" label={`Organizaciones (${consorcios.length})`} />
                            )}
                            {AVAILABLE_DATA_TABS.includes('unidades') && (
                              <Tab value="unidades" label={`Unidades (${unidades.length})`} />
                            )}
                            {AVAILABLE_DATA_TABS.includes('gastos') && (
                              <Tab value="gastos" label={`Gastos (${gastos.length})`} />
                            )}
                            {AVAILABLE_DATA_TABS.includes('gastosExtras') && (
                              <Tab value="gastosExtras" label={`Gastos extras (${gastosExtras.length})`} />
                            )}
                            {AVAILABLE_DATA_TABS.includes('expensas') && (
                              <Tab value="expensas" label={`Expensas (${expensas.length})`} />
                            )}
                            {AVAILABLE_DATA_TABS.includes('pagos') && (
                              <Tab value="pagos" label={`Pagos (${pagos.length})`} />
                            )}
                          </Tabs>
                        </Box>
                      </Box>

                      {dataTab === 'consorcios' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Organizaciones
                          </Typography>
                          {consorcios.length === 0 ? (
                            <Alert severity="info">No hay organizaciones cargadas todavía.</Alert>
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
                                      {consorcioTipoLabels[consorcio.tipo]} | {consorcio.direccion}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Módulos: {consorcio.modulos.map((modulo) => moduloLabels[modulo]).join(', ')}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ minWidth: 860 }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Nombre</TableCell>
                                      <TableCell>Tipo</TableCell>
                                      <TableCell>Dirección</TableCell>
                                      <TableCell>Módulos</TableCell>
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
                                        <TableCell>{consorcioTipoLabels[consorcio.tipo]}</TableCell>
                                        <TableCell>{consorcio.direccion}</TableCell>
                                        <TableCell>{consorcio.modulos.map((modulo) => moduloLabels[modulo]).join(', ')}</TableCell>
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
                                      <Typography variant="subtitle2">{tipoPropiedadLabels[unidad.tipo]} {unidad.numero}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Nombre: {unidad.nombre?.trim() || '-'}
                                      </Typography>
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
                                      <TableCell>Tipo</TableCell>
                                      <TableCell>Nombre</TableCell>
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
                                        <TableCell>{tipoPropiedadLabels[unidad.tipo]}</TableCell>
                                        <TableCell>{unidad.nombre?.trim() || '-'}</TableCell>
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

                      {dataTab === 'gastosExtras' && (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Gastos extras
                          </Typography>
                          {gastosExtras.length === 0 ? (
                            <Alert severity="info">No hay gastos extras cargados todavía.</Alert>
                          ) : (
                            <>
                              <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
                                {gastosExtras.map((gastoExtra) => (
                                  <Paper key={`gasto-extra-card-${gastoExtra.id}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #dce9e4' }}>
                                    <Stack spacing={0.6}>
                                      <Typography variant="subtitle2">{gastoExtra.descripcion}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Unidad: {gastoExtra.unidad?.numero ?? 'N/D'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Cantidad: {gastoExtra.cantidad}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Fecha: {new Date(gastoExtra.fecha).toLocaleDateString('es-AR')}
                                      </Typography>
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>

                              <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                                <Table size="small" sx={{ minWidth: 660 }}>
                                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                      <TableCell>Descripción</TableCell>
                                      <TableCell>Unidad</TableCell>
                                      <TableCell align="right">Cantidad</TableCell>
                                      <TableCell>Fecha</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {gastosExtras.map((gastoExtra) => (
                                      <TableRow key={gastoExtra.id}>
                                        <TableCell>{gastoExtra.descripcion}</TableCell>
                                        <TableCell>{gastoExtra.unidad?.numero ?? 'N/D'}</TableCell>
                                        <TableCell align="right">{gastoExtra.cantidad}</TableCell>
                                        <TableCell>{new Date(gastoExtra.fecha).toLocaleDateString('es-AR')}</TableCell>
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
