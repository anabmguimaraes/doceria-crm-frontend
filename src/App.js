import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, Package, Calendar, Truck, DollarSign, BarChart3,
  Search, Bell, Menu, User as UserIcon, Settings, LogOut, Plus, TrendingUp, Heart, AlertTriangle,
  Clock, Star, Edit, Trash2, Eye, Filter, X, Save, MessageCircle, Phone, Cake, Coffee, Cookie, Sparkles, Gift, ChevronLeft, ChevronRight, Printer, Home, BookOpen, Instagram, MapPin, UploadCloud, Image as ImageIcon, MessageSquare, VolumeX
} from 'lucide-react';
// Importações do Firebase
import { auth, db, storage } from './firebaseClientConfig.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API_BASE_URL = 'https://doceria-crm-backend.onrender.com/api';

// Hook customizado para dados gerais
const useData = ({ onNewOrder }) => {
  const [data, setData] = useState({ clientes: [], pedidos: [], produtos: [], despesas: [] });
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialFetchDone.current) {
        setLoading(true);
    }
    try {
      const fetchAndParse = async (url) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Falha na requisição para ${url}`);
          const jsonData = await response.json();
          return Array.isArray(jsonData) ? jsonData : [];
      };
      const oldPendingOrdersCount = initialFetchDone.current ? data.pedidos.filter(p => p.status === 'Pendente').length : -1;
      const [clientes, pedidos, produtos, despesas] = await Promise.all([
          fetchAndParse(`${API_BASE_URL}/clientes`),
          fetchAndParse(`${API_BASE_URL}/pedidos`),
          fetchAndParse(`${API_BASE_URL}/produtos`),
          fetchAndParse(`${API_BASE_URL}/despesas`),
      ]);
      const newPendingOrdersCount = pedidos.filter(p => p.status === 'Pendente').length;
      if (initialFetchDone.current && newPendingOrdersCount > oldPendingOrdersCount) {
        onNewOrder();
      }
      setData({ clientes, pedidos, produtos, despesas });
    } catch (error) {
      console.error("Erro ao carregar dados da API:", error);
    } finally {
      setLoading(false);
      initialFetchDone.current = true;
    }
  }, [data.pedidos, onNewOrder]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = async (section, item) => {
    await fetch(`${API_BASE_URL}/${section}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    fetchData();
  };

  const updateItem = async (section, id, updatedItem) => {
    await fetch(`${API_BASE_URL}/${section}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedItem) });
    fetchData();
  };

  const deleteItem = async (section, id) => {
    await fetch(`${API_BASE_URL}/${section}/${id}`, { method: 'DELETE' });
    setData(prev => ({ ...prev, [section]: prev[section].filter(item => item.id !== id) }));
  };

  return { data, loading, addItem, updateItem, deleteItem };
};

// Componentes de UI
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4"> <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} /> <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}> <div className="flex items-center justify-between p-6 border-b border-gray-100"> <h2 className="text-xl font-semibold text-gray-800">{title}</h2> <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"> <X className="w-5 h-5" /> </button> </div> <div className="p-6 overflow-y-auto"> {children} </div> </div> </div> );
};
const Button = ({ children, variant = "primary", size = "md", onClick, className = "", disabled = false, type = "button" }) => {
  const baseClasses = "font-medium rounded-xl transition-all flex items-center gap-2 justify-center";
  const variants = { primary: "bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5", secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg", danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl" };
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3", lg: "px-8 py-4 text-lg" };
  return (<button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>{children}</button>);
};
const Input = ({ label, error, className = "", ...props }) => (<div className="space-y-1">{label && <label className="block text-sm font-medium text-gray-700">{label}</label>}<input {...props} className={`w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-pink-500 focus:border-transparent ${error ? 'border-red-300' : 'border-gray-300'} ${className}`} />{error && <p className="text-sm text-red-600">{error}</p>}</div>);
const Textarea = ({ label, error, className = "", ...props }) => (<div className="space-y-1">{label && <label className="block text-sm font-medium text-gray-700">{label}</label>}<textarea {...props} className={`w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-pink-500 focus:border-transparent ${error ? 'border-red-300' : 'border-gray-300'} ${className}`} />{error && <p className="text-sm text-red-600">{error}</p>}</div>);
const Select = ({ label, error, className = "", children, ...props }) => (<div className="space-y-1">{label && <label className="block text-sm font-medium text-gray-700">{label}</label>}<select {...props} className={`w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}>{children}</select>{error && <p className="text-sm text-red-600">{error}</p>}</div>);
const Table = ({ columns, data, actions = [] }) => (<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gradient-to-r from-gray-50 to-gray-100"><tr>{columns.map((col, index) => (<th key={index} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{col.header}</th>))}{actions.length > 0 && <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Ações</th>}</tr></thead><tbody className="divide-y divide-gray-100">{(data || []).map((row, rowIndex) => (<tr key={row.id || row.uid || rowIndex} className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-all">{columns.map((col, colIndex) => (<td key={colIndex} className="px-6 py-4 text-sm text-gray-900">{col.render ? col.render(row) : row[col.key]}</td>))}{actions.length > 0 && (<td className="px-6 py-4 text-right"><div className="flex justify-end gap-2">{actions.map((action, actionIndex) => (<button key={actionIndex} onClick={() => action.onClick(row)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={action.label}><action.icon className="w-4 h-4 text-gray-600" /></button>))}</div></td>)}</tr>))}</tbody></table></div></div>);

// Helper function moved here to be accessible by multiple components
const getJSDate = (firestoreTimestamp) => {
  if (!firestoreTimestamp) return null;
  if (typeof firestoreTimestamp.toDate === 'function') {
    return firestoreTimestamp.toDate();
  }
  const date = new Date(firestoreTimestamp);
  return isNaN(date.getTime()) ? null : date;
};

// Componente principal
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('pagina-inicial');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: () => {} });
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) { clearInterval(alarmIntervalRef.current); alarmIntervalRef.current = null; }
    if (oscillatorRef.current) { oscillatorRef.current.stop(); oscillatorRef.current = null; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') { audioContextRef.current.close(); audioContextRef.current = null; }
    setIsAlarmActive(false);
  }, []);

  const startAlarm = useCallback(() => {
    if (isAlarmActive) return; 
    setIsAlarmActive(true);
    const context = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillatorRef.current = oscillator;
    gainRef.current = gain;
    alarmIntervalRef.current = setInterval(() => {
        if(audioContextRef.current && audioContextRef.current.state === 'running'){
            const now = audioContextRef.current.currentTime;
            gainRef.current.gain.setValueAtTime(1, now);
            gainRef.current.gain.setValueAtTime(0, now + 0.2);
        }
    }, 1000);
  }, [isAlarmActive]);
  
  const { data, loading, addItem, updateItem, deleteItem } = useData({ onNewOrder: startAlarm });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        setUser({ auth: authUser, role: userDoc.exists() ? userDoc.data().role || 'Atendente' : 'Atendente' });
        // Redirect to dashboard only on initial login, not on every page change.
        if (currentPage === 'pagina-inicial' && !user) {
            setCurrentPage('dashboard');
        }
      } else {
        setUser(null);
        setCurrentPage('pagina-inicial');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [user, currentPage]);

  const handleLogin = async () => { try { setLoginError(''); await signInWithEmailAndPassword(auth, email, password); setShowLogin(false); setEmail(''); setPassword(''); setCurrentPage('dashboard'); } catch (error) { setLoginError('Email ou senha inválidos.'); } };
  const handleRegister = async () => { try { setLoginError(''); const userCredential = await createUserWithEmailAndPassword(auth, email, password); await setDoc(doc(db, "users", userCredential.user.uid), { email: userCredential.user.email, role: "Atendente" }); setShowLogin(false); setEmail(''); setPassword(''); setCurrentPage('dashboard'); } catch (error) { setLoginError(error.code === 'auth/email-already-in-use' ? 'Este email já está em uso.' : 'Erro ao registrar.'); } };
  const handleLogout = async () => { await signOut(auth); };

  const allMenuItems = [ { id: 'pagina-inicial', label: 'Página Inicial', icon: Home, roles: ['admin', 'Atendente', null] }, { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'Atendente'] }, { id: 'clientes', label: 'Clientes', icon: Users, roles: ['admin', 'Atendente'] }, { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, roles: ['admin', 'Atendente'] }, { id: 'produtos', label: 'Produtos', icon: Package, roles: ['admin', 'Atendente'] }, { id: 'agenda', label: 'Agenda', icon: Calendar, roles: ['admin', 'Atendente'] }, { id: 'fornecedores', label: 'Fornecedores', icon: Truck, roles: ['admin', 'Atendente'] }, { id: 'relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin', 'Atendente'] }, { id: 'financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin'] }, { id: 'configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] }, ];
  const currentUserRole = user ? user.role : null;
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUserRole));
  
  const ImageSlider = ({ images, onImageClick }) => { const [currentIndex, setCurrentIndex] = useState(0); const nextSlide = useCallback(() => { setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length); }, [images.length]); useEffect(() => { const timer = setInterval(nextSlide, 5000); return () => clearInterval(timer); }, [nextSlide]); return ( <div className="h-64 md:h-96 w-full m-auto relative group rounded-2xl overflow-hidden shadow-lg"> <div style={{ backgroundImage: `url(${images[currentIndex]})` }} className="w-full h-full bg-center bg-cover duration-500 cursor-pointer" onClick={() => onImageClick(images[currentIndex])}></div> </div> ); };
  
  // Componentes de Páginas
  const PaginaInicial = () => {
    const slideImages = [ '/slide/slide1.png', '/slide/slide2.png', '/slide/slide3.png' ];
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Página Inicial</h1>
            <p className="text-gray-600 mt-1">Seja bem-vindo à Ana Guimarães Doceria! É um prazer ter você em nosso cantinho doce da internet. Aqui começa sua experiência com os sabores que encantam e transformam momentos em memórias.</p>
          </div>
          <div className="flex gap-4">
              <Button onClick={() => window.open('/cardapio.html', '_blank')}><BookOpen className="w-4 h-4" /> Cardápio Delivery</Button>
              <Button onClick={() => window.open('/cardapio-festa.html', '_blank')}><Cake className="w-4 h-4" /> Cardápio de Festas</Button>
          </div>
        </div>
        <ImageSlider images={slideImages} onImageClick={setLightboxImage} />
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sobre Nós</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Somos uma doceria apaixonada por criar momentos doces e inesquecíveis. Cada bolo, torta e doce é feito com ingredientes de alta qualidade e muito carinho, pensando em levar mais sabor para o seu dia.
                    </p>
                    <div className="space-y-3">
                        <a href="https://www.instagram.com/anaguimaraes.doceria/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-600 font-semibold hover:underline">
                            <Instagram size={20} /> @anaguimaraes.doceria
                        </a>
                        <a href="https://wa.me/5562991056075" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 font-semibold hover:underline">
                            <MessageCircle size={20} /> (62) 99105-6075
                        </a>
                        <p className="flex items-center gap-2 text-gray-700">
                            <MapPin size={20} /> Av. Comercial, 433 - Jardim Nova Esperanca, Goiânia - GO
                        </p>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-lg mb-2">Horário de Funcionamento:</h3>
                        <ul className="text-gray-600">
                            <li>Segunda a Sexta: 09:30 – 18:30</li>
                            <li>Sábado: 09:00 – 14:00</li>
                            <li>Domingo: Fechado</li>
                        </ul>
                    </div>
                </div>
                <div>
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.890300951331!2d-49.3274707!3d-16.6725019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ef50062f12789%3A0x5711296a03567da3!2sAna%20Guimar%C3%A3es%20doceria!5e0!3m2!1spt-BR!2sbr!4v1661282662551!5m2!1spt-BR!2sbr" width="100%" height="300" style={{border:0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-lg shadow-md" title="Localização da Doceria"></iframe>
                </div>
            </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lastSunday = new Date(); lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay()); lastSunday.setHours(0, 0, 0, 0);
    const vendasHoje = (data.pedidos || []).filter(pedido => { const pedidoDate = getJSDate(pedido.createdAt); if (!pedidoDate) return false; pedidoDate.setHours(0,0,0,0); return pedidoDate.getTime() === today.getTime() && pedido.status === 'Finalizado'; }).reduce((acc, pedido) => acc + (pedido.total || 0), 0);
    const numVendasHoje = (data.pedidos || []).filter(pedido => { const pedidoDate = getJSDate(pedido.createdAt); if (!pedidoDate) return false; pedidoDate.setHours(0,0,0,0); return pedidoDate.getTime() === today.getTime() && pedido.status === 'Finalizado'; }).length;
    const vendasSemana = (data.pedidos || []).filter(pedido => { const pedidoDate = getJSDate(pedido.createdAt); if (!pedidoDate) return false; return pedidoDate >= lastSunday && pedidoDate <= new Date() && pedido.status === 'Finalizado'; }).reduce((acc, pedido) => acc + (pedido.total || 0), 0);
    const numVendasSemana = (data.pedidos || []).filter(pedido => { const pedidoDate = getJSDate(pedido.createdAt); if (!pedidoDate) return false; return pedidoDate >= lastSunday && pedidoDate <= new Date() && pedido.status === 'Finalizado'; }).length;
    
    const activeStatuses = ['Pendente', 'Em Produção', 'Pronto para Entrega'];
    const pedidosPendentes = (data.pedidos || []).filter(p => activeStatuses.includes(p.status) && p.origem !== 'Cardapio Online').length;
    const pedidosWhatsApp = (data.pedidos || []).filter(p => activeStatuses.includes(p.status) && p.origem === 'Cardapio Online').length;
    
    const clientesAtivos = (data.clientes || []).length;
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        {isAlarmActive && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center animate-pulse">
            <div className="flex items-center"><Bell className="w-6 h-6 mr-3" /><p className="font-bold">Novo pedido recebido!</p></div>
            <Button variant="danger" size="sm" onClick={stopAlarm}><VolumeX className="w-4 h-4 mr-2" />Desativar Alarme</Button>
          </div>
        )}
        <div><h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Dashboard</h1><p className="text-gray-600 mt-1">Visão geral da sua doceria</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg"><DollarSign className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Vendas Hoje</p><h2 className="text-2xl font-bold text-gray-800">R$ {vendasHoje.toFixed(2)}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCart className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Nº Vendas Hoje</p><h2 className="text-2xl font-bold text-gray-800">{numVendasHoje}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"><BarChart3 className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Vendas Semana</p><h2 className="text-2xl font-bold text-gray-800">R$ {vendasSemana.toFixed(2)}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCart className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Nº Vendas Semana</p><h2 className="text-2xl font-bold text-gray-800">{numVendasSemana}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><Heart className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Clientes ativos</p><h2 className="text-2xl font-bold text-gray-800">{clientesAtivos}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Clock className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Pendentes (CRM)</p><h2 className="text-2xl font-bold text-gray-800">{pedidosPendentes}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Pendentes (WhatsApp)</p><h2 className="text-2xl font-bold text-gray-800">{pedidosWhatsApp}</h2></div></div></div>
        </div>
      </div>
    );
  };

  const Clientes = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({ nome: "", email: "", telefone: "", endereco: "", aniversario: "", status: "Ativo" });
    const filteredClients = (data.clientes || []).filter(c => (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) );
    const resetForm = () => { setShowModal(false); setEditingClient(null); setFormData({ nome: "", email: "", telefone: "", endereco: "", aniversario: "", status: "Ativo" }); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingClient) {
            await updateItem('clientes', editingClient.id, formData);
        } else {
            await addItem('clientes', { ...formData, totalCompras: 0 });
        }
        resetForm();
    };
    const handleEdit = (client) => { setEditingClient(client); setFormData(client); setShowModal(true); };
    const columns = [
        { header: "Cliente", render: (row) => (<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-md">{row.nome.charAt(0).toUpperCase()}</div><div><p className="font-semibold text-gray-800">{row.nome}</p><p className="text-sm text-gray-500">{row.email}</p></div></div>) },
        { header: "Telefone", render: (row) => (<span>{row.telefone}</span>) },
        {
          header: "Data de Aniversário",
          render: (row) => {
            if (!row.aniversario) return '-';
            // Input type="date" gives YYYY-MM-DD. Splitting is safe.
            const parts = row.aniversario.split('-');
            if (parts.length !== 3) return '-';
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
          }
        },
        { header: "Total Compras", render: (row) => (<span className="font-semibold text-green-600">R$ {(row.totalCompras || 0).toFixed(2)}</span>) },
        { header: "Última Compra", render: (row) => row.ultimaCompra ? new Date(row.ultimaCompra).toLocaleDateString('pt-BR') : '-' },
        { header: "Status", render: (row) => (<span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{row.status}</span>) }
    ];
    const actions = [ { icon: Edit, label: "Editar", onClick: handleEdit }, { icon: Trash2, label: "Excluir", onClick: (row) => setConfirmDelete({ isOpen: true, onConfirm: () => deleteItem('clientes', row.id) }) } ];
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Gestão de Clientes</h1><p className="text-gray-600 mt-1">Gerencie seus clientes</p></div><Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Novo Cliente</Button></div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500" /></div>
        <Table columns={columns} data={filteredClients} actions={actions} />
        <Modal isOpen={showModal} onClose={resetForm} title={editingClient ? "Editar Cliente" : "Novo Cliente"} size="lg"><form onSubmit={handleSubmit} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Nome Completo" type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required /><Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /><Input label="Telefone" type="tel" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} /><Input label="Data de Aniversário" type="date" value={formData.aniversario} onChange={(e) => setFormData({...formData, aniversario: e.target.value})} /></div><Input label="Endereço" type="text" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} /><div className="flex justify-end gap-3 pt-4"><Button variant="secondary" type="button" onClick={resetForm}>Cancelar</Button><Button type="submit"><Save className="w-4 h-4" />{editingClient ? "Salvar Alterações" : "Criar Cliente"}</Button></div></form></Modal>
      </div>
    );
  };
  
  const Produtos = () => {
    const [searchTerm, setSearchTerm] = useState(""); const [showModal, setShowModal] = useState(false); const [editingProduct, setEditingProduct] = useState(null); const [formData, setFormData] = useState({ nome: "", categoria: "Delivery", preco: "", custo: "", estoque: "", status: "Ativo", descricao: "", tempoPreparo: "", imageUrl: "" }); const [imageFile, setImageFile] = useState(null); const [imagePreview, setImagePreview] = useState(null); const [isUploading, setIsUploading] = useState(false);
    const filteredProducts = (data.produtos || []).filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const resetForm = () => { setShowModal(false); setEditingProduct(null); setFormData({ nome: "", categoria: "Delivery", preco: "", custo: "", estoque: "", status: "Ativo", descricao: "", tempoPreparo: "", imageUrl: "" }); setImageFile(null); setImagePreview(null); };
    const handleImageChange = (e) => { if (e.target.files[0]) { const file = e.target.files[0]; setImageFile(file); setImagePreview(URL.createObjectURL(file)); } };
    const handleSubmit = async (e) => { e.preventDefault(); setIsUploading(true); let imageUrl = formData.imageUrl || ""; if (imageFile) { const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`); await uploadBytes(imageRef, imageFile); imageUrl = await getDownloadURL(imageRef); } const productData = { ...formData, preco: parseFloat(formData.preco || 0), custo: parseFloat(formData.custo || 0), estoque: parseInt(formData.estoque || 0), imageUrl: imageUrl }; if (editingProduct) { await updateItem('produtos', editingProduct.id, productData); } else { await addItem('produtos', productData); } setIsUploading(false); resetForm(); };
    const handleEdit = (product) => { setEditingProduct(product); setFormData({ ...product, preco: String(product.preco), custo: String(product.custo), estoque: String(product.estoque) }); setImagePreview(product.imageUrl || null); setShowModal(true); };
    const columns = [ { header: "Produto", render: (row) => (<div className="flex items-center gap-3"><img src={row.imageUrl || 'https://placehold.co/40x40/FFC0CB/FFFFFF?text=Doce'} alt={row.nome} className="w-10 h-10 rounded-xl object-cover shadow-md" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/FFC0CB/FFFFFF?text=Erro'; }}/><div><p className="font-semibold text-gray-800">{row.nome}</p><p className="text-sm text-gray-500">{row.categoria}</p></div></div>)}, { header: "Preço", render: (row) => <span className="font-semibold text-green-600">R$ {(row.preco || 0).toFixed(2)}</span> }, { header: "Estoque", render: (row) => <span className={`font-medium ${row.estoque < 10 ? 'text-red-600' : 'text-gray-800'}`}>{row.estoque} un</span> }, { header: "Status", render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.status}</span> } ];
    const actions = [ { icon: Edit, label: "Editar", onClick: handleEdit }, { icon: Trash2, label: "Excluir", onClick: (row) => setConfirmDelete({ isOpen: true, onConfirm: () => deleteItem('produtos', row.id) }) } ];
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Gestão de Produtos</h1><p className="text-gray-600 mt-1">Gerencie seu cardápio e estoque</p></div><Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Novo Produto</Button></div>
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500" /></div>
        <Table columns={columns} data={filteredProducts} actions={actions} />
        <Modal isOpen={showModal} onClose={resetForm} title={editingProduct ? "Editar Produto" : "Novo Produto"} size="xl"><form onSubmit={handleSubmit} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-2 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Nome do Produto" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required /><Select label="Categoria" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} required><option value="Delivery">Delivery</option><option value="Festa">Festa</option></Select><Input label="Preço (R$)" type="number" step="0.01" value={formData.preco} onChange={(e) => setFormData({...formData, preco: e.target.value})} /><Input label="Custo (R$)" type="number" step="0.01" value={formData.custo} onChange={(e) => setFormData({...formData, custo: e.target.value})} /><Input label="Estoque" type="number" value={formData.estoque} onChange={(e) => setFormData({...formData, estoque: e.target.value})} /><Input label="Tempo de Preparo" value={formData.tempoPreparo} onChange={(e) => setFormData({...formData, tempoPreparo: e.target.value})} /></div><div className="relative"><Textarea label="Descrição" rows="3" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} /></div></div><div className="space-y-2"><label className="block text-sm font-medium text-gray-700">Foto do Produto</label><div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-center p-4">{imagePreview ? (<img src={imagePreview} alt="Pré-visualização" className="max-h-full max-w-full object-contain rounded-lg"/>) : (<div className="text-gray-500"><ImageIcon className="mx-auto h-12 w-12" /><p className="mt-2 text-sm">Clique para selecionar</p></div>)}</div><Input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" /></div></div><div className="flex justify-end gap-3 pt-4"><Button variant="secondary" type="button" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={isUploading}><Save className="w-4 h-4" />{isUploading ? 'Salvando...' : (editingProduct ? "Salvar Alterações" : "Criar Produto")}</Button></div></form></Modal>
      </div>
    );
  };
  
  const Configuracoes = () => {
    const [users, setUsers] = useState([]); const [usersLoading, setUsersLoading] = useState(true); const [showUserModal, setShowUserModal] = useState(false); const [editingUser, setEditingUser] = useState(null); const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'Atendente' }); const [userFormError, setUserFormError] = useState('');
    const fetchUsers = useCallback(async () => { setUsersLoading(true); try { const response = await fetch(`${API_BASE_URL}/users`); if (!response.ok) throw new Error("Falha ao buscar usuários"); const data = await response.json(); setUsers(data.filter(u => u.uid !== user.auth.uid)); } catch (error) { console.error("Erro ao buscar usuários:", error); setUsers([]); } finally { setUsersLoading(false); } }, [user.auth.uid]);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    const resetUserForm = () => { setShowUserModal(false); setEditingUser(null); setUserFormData({ email: '', password: '', role: 'Atendente' }); setUserFormError(''); };
    const handleUserSubmit = async (e) => { e.preventDefault(); setUserFormError(''); try { let response; if (editingUser) { await fetch(`${API_BASE_URL}/users/${editingUser.uid}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: userFormData.role }), }); if (userFormData.password) { await fetch(`${API_BASE_URL}/users/${editingUser.uid}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: userFormData.password }), }); } } else { response = await fetch(`${API_BASE_URL}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userFormData), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro desconhecido'); } } fetchUsers(); resetUserForm(); } catch (error) { console.error("Erro ao salvar usuário:", error); setUserFormError('Ocorreu um erro. Verifique se o e-mail já existe ou a senha é muito fraca.'); } };
    const handleEditUser = (userToEdit) => { setEditingUser(userToEdit); setUserFormData({ email: userToEdit.email, password: '', role: userToEdit.role }); setShowUserModal(true); };
    const handleDeleteUser = async (uid) => { try { await fetch(`${API_BASE_URL}/users/${uid}`, { method: 'DELETE' }); fetchUsers(); } catch (error) { console.error("Erro ao deletar usuário:", error); } setConfirmDelete({ isOpen: false, onConfirm: () => {} }); };
    const columns = [ { header: "Email", key: "email" }, { header: "Permissão", render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{row.role}</span> } ];
    const actions = [ { icon: Edit, label: "Editar", onClick: handleEditUser }, { icon: Trash2, label: "Excluir", onClick: (row) => setConfirmDelete({ isOpen: true, onConfirm: () => handleDeleteUser(row.uid) }) } ];
    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">Configurações</h1><p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p></div>
                <Button onClick={() => setShowUserModal(true)}><Plus className="w-4 h-4" /> Novo Usuário</Button>
            </div>
            {usersLoading ? <p>Carregando usuários...</p> : <Table columns={columns} data={users} actions={actions} />}
            <Modal isOpen={showUserModal} onClose={resetUserForm} title={editingUser ? "Editar Usuário" : "Novo Usuário"}>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                    <Input label="Email" type="email" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} required disabled={!!editingUser} />
                    <Input label="Senha" type="password" placeholder={editingUser ? "Deixe em branco para não alterar" : ""} required={!editingUser} onChange={(e) => setUserFormData({...userFormData, password: e.target.value})} />
                    <Select label="Permissão" value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value})} required>
                        <option value="Atendente">Atendente</option>
                        <option value="admin">Administrador</option>
                    </Select>
                    {userFormError && <p className="text-sm text-red-600">{userFormError}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" type="button" onClick={resetUserForm}>Cancelar</Button>
                        <Button type="submit"><Save className="w-4 h-4" /> Salvar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
  };
  
  const Pedidos = () => {
    const [searchTerm, setSearchTerm] = useState(""); const [showModal, setShowModal] = useState(false); const [editingOrder, setEditingOrder] = useState(null); const [formData, setFormData] = useState({ clienteId: '', clienteNome: '', itens: [], total: 0, status: 'Pendente', origem: 'Manual' }); const [viewingOrder, setViewingOrder] = useState(null);
    const pedidosComNomes = (data.pedidos || []).map(pedido => { const cliente = data.clientes.find(c => c.id === pedido.clienteId); return { ...pedido, clienteNome: cliente ? cliente.nome : (pedido.clienteNome || 'Cliente não encontrado') } });
    const filteredOrders = pedidosComNomes.filter(p => (p.clienteNome && p.clienteNome.toLowerCase().includes(searchTerm.toLowerCase())) ).sort((a, b) => { const dateA = getJSDate(a.createdAt) || 0; const dateB = getJSDate(b.createdAt) || 0; return dateB - dateA; });
    
    const resetForm = () => {
        setShowModal(false);
        setEditingOrder(null);
        setFormData({ clienteId: '', clienteNome: '', itens: [], total: 0, status: 'Pendente', origem: 'Manual' });
    };

    const handleNewOrder = () => {
        setEditingOrder(null);
        setFormData({
            clienteId: '',
            clienteNome: '',
            itens: [],
            total: 0,
            status: 'Pendente',
            origem: 'Manual'
        });
        setShowModal(true);
    };

    const handleAddItemToOrder = (produto) => { setFormData(prev => { const existingItem = prev.itens.find(item => item.id === produto.id); let newItens; if (existingItem) { newItens = prev.itens.map(item => item.id === produto.id ? { ...item, quantity: item.quantity + 1 } : item); } else { newItens = [...prev.itens, { ...produto, quantity: 1 }]; } const newTotal = newItens.reduce((sum, item) => sum + (item.preco * item.quantity), 0); return { ...prev, itens: newItens, total: newTotal }; }); };
    const handleRemoveItemFromOrder = (produtoId) => { setFormData(prev => { const newItens = prev.itens.filter(item => item.id !== produtoId); const newTotal = newItens.reduce((sum, item) => sum + (item.preco * item.quantity), 0); return { ...prev, itens: newItens, total: newTotal }; }); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const orderData = { ...formData, clienteNome: data.clientes.find(c => c.id === formData.clienteId)?.nome };
        if (editingOrder) {
            await updateItem('pedidos', editingOrder.id, orderData);
        } else {
            await addItem('pedidos', orderData);
        }
        resetForm();
    };
    const handleEdit = (order) => { setEditingOrder(order); setFormData(order); setShowModal(true); };
    const getStatusClass = (status) => { switch (status) { case 'Pendente': return 'bg-yellow-100 text-yellow-800'; case 'Em Produção': return 'bg-blue-100 text-blue-800'; case 'Finalizado': return 'bg-green-100 text-green-800'; case 'Cancelado': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-800'; } };
    const columns = [ { header: "Cliente", key: "clienteNome" }, { header: "Total", render: (row) => <span className="font-semibold text-green-600">R$ {(row.total || 0).toFixed(2)}</span> }, { header: "Data", render: (row) => { const date = getJSDate(row.createdAt); return date ? date.toLocaleDateString('pt-BR') : '-'; } }, { header: "Origem", key: "origem"}, { header: "Status", render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(row.status)}`}>{row.status}</span> } ];
    const actions = [ { icon: Eye, label: "Visualizar", onClick: (row) => setViewingOrder(row) }, { icon: Edit, label: "Editar", onClick: handleEdit }, { icon: Trash2, label: "Excluir", onClick: (row) => setConfirmDelete({ isOpen: true, onConfirm: () => deleteItem('pedidos', row.id) }) } ];
    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Gestão de Pedidos</h1><p className="text-gray-600 mt-1">Acompanhe e gerencie todos os pedidos</p></div>
                <Button onClick={handleNewOrder}><Plus className="w-4 h-4" /> Novo Pedido</Button>
            </div>
            <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" /></div>
            <Table columns={columns} data={filteredOrders} actions={actions} />
            <Modal isOpen={showModal} onClose={resetForm} title={editingOrder ? "Editar Pedido" : "Novo Pedido"} size="xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label="Cliente" value={formData.clienteId} onChange={(e) => setFormData({...formData, clienteId: e.target.value})} required><option value="">Selecione um cliente</option>{data.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select>
                        <Select label="Status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} required><option>Pendente</option><option>Em Produção</option><option>Pronto para Entrega</option><option>Finalizado</option><option>Cancelado</option></Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2"><h3 className="font-semibold">Adicionar Produtos</h3><div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">{data.produtos.map(p => (<div key={p.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50"><span>{p.nome} - R$ {p.preco.toFixed(2)}</span><Button size="sm" variant="secondary" onClick={() => handleAddItemToOrder(p)}>+</Button></div>))}</div></div>
                        <div className="space-y-2"><h3 className="font-semibold">Itens no Pedido</h3><div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">{formData.itens.length === 0 ? <p className="text-sm text-gray-500 text-center p-4">Nenhum item</p> : formData.itens.map(item => (<div key={item.id} className="flex justify-between items-center p-2 rounded bg-pink-50"><span>{item.quantity}x {item.nome}</span><div className="flex items-center gap-2"><span className="text-sm">R$ {(item.preco * item.quantity).toFixed(2)}</span><button type="button" onClick={() => handleRemoveItemFromOrder(item.id)} className="text-red-500"><Trash2 size={14}/></button></div></div>))}</div><div className="text-right font-bold text-lg mt-2">Total: R$ {formData.total.toFixed(2)}</div></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4"><Button variant="secondary" type="button" onClick={resetForm}>Cancelar</Button><Button type="submit"><Save className="w-4 h-4" />{editingOrder ? "Salvar Alterações" : "Criar Pedido"}</Button></div>
                </form>
            </Modal>
            <Modal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} title={`Detalhes do Pedido - ${viewingOrder?.clienteNome}`} size="lg">{viewingOrder && <div className="space-y-4"><p><strong>Status:</strong> <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(viewingOrder.status)}`}>{viewingOrder.status}</span></p><p><strong>Data:</strong> {viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString('pt-BR') : '-'}</p><p><strong>Origem:</strong> {viewingOrder.origem}</p><h4 className="font-semibold pt-4 border-t">Itens:</h4><ul className="list-disc list-inside space-y-1">{viewingOrder.itens.map(item => (<li key={item.id}>{item.quantity}x {item.nome} - R$ {(item.preco * item.quantity).toFixed(2)}</li>))}</ul><p className="text-right font-bold text-xl pt-4 border-t">Total: R$ {viewingOrder.total.toFixed(2)}</p></div>}</Modal>
        </div>
    );
  }

  const PlaceholderPage = ({ title }) => (<div className="p-6"><h1 className="text-3xl font-bold text-pink-600">{title}</h1><p>Em desenvolvimento...</p></div>);

  const renderCurrentPage = () => {
    if (authLoading || (loading && user)) {
      return (<div className="flex h-full w-full items-center justify-center"><p className="text-lg text-gray-500">Carregando...</p></div>);
    }
    
    switch (currentPage) {
      case 'pagina-inicial': return <PaginaInicial />;
      case 'dashboard': return user ? <Dashboard /> : <PaginaInicial />;
      case 'clientes': return user ? <Clientes /> : <PaginaInicial />;
      case 'produtos': return user ? <Produtos /> : <PaginaInicial />;
      case 'pedidos': return user ? <Pedidos /> : <PaginaInicial />;
      case 'configuracoes': return user?.role === 'admin' ? <Configuracoes /> : <PaginaInicial />;
      default: return user ? <PlaceholderPage title={allMenuItems.find(i=>i.id===currentPage)?.label || "Página"} /> : <PaginaInicial />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b h-16">
          <img src="logotipo.png" alt="Logotipo Ana Doceria" className={`h-8 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-pink-50">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${currentPage === item.id ? 'bg-pink-100 text-pink-700' : 'hover:bg-pink-50 text-gray-700'} ${!sidebarOpen ? 'justify-center' : ''}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        {user && (
          <div className="p-4 border-t">
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 text-gray-700 ${!sidebarOpen ? 'justify-center' : ''}`}>
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && 'Sair'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-white shadow-sm h-16">
          <div/>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
            <div className="relative">
              <button onClick={() => { if(!user) setShowLogin(true) }} className="p-2 rounded-full hover:bg-gray-100">
                <UserIcon className="w-6 h-6 text-gray-600" />
              </button>
              {user && <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>}
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
            {renderCurrentPage()}
        </main>
      </div>

      <Modal isOpen={showLogin} onClose={() => setShowLogin(false)} title={isRegistering ? "Registrar Nova Conta" : "Login"} size="sm">
        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Senha" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
          <div className="flex flex-col gap-2">
            {isRegistering ? (
              <Button onClick={handleRegister}>Registrar</Button>
            ) : (
              <Button onClick={handleLogin}>Entrar</Button>
            )}
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-pink-600 hover:underline text-center">
              {isRegistering ? "Já tem uma conta? Faça login" : "Não tem uma conta? Registre-se"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmDelete.isOpen} onClose={() => setConfirmDelete({ isOpen: false, onConfirm: ()=>{} })} title="Confirmar Exclusão" size="sm">
        <div className="space-y-6">
            <p className="text-gray-600">Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setConfirmDelete({ isOpen: false, onConfirm: ()=>{} })}>Cancelar</Button>
                <Button variant="danger" onClick={confirmDelete.onConfirm}>Excluir</Button>
            </div>
        </div>
      </Modal>
      
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} alt="Visualização Ampliada" className="max-w-full max-h-full rounded-lg"/>
        </div>
      )}
    </div>
  );
}

export default App;

