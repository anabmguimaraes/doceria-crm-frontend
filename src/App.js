import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, Package, Calendar, Truck, DollarSign, BarChart3,
  Search, Bell, Menu, User, Settings, LogOut, Plus, TrendingUp, Heart, AlertTriangle,
  Clock, Star, Edit, Trash2, Eye, Filter, X, Save, MessageCircle, Phone, Cake, Coffee, Cookie, Sparkles, Gift, ChevronLeft, ChevronRight, Printer, Home, BookOpen, Instagram, MapPin, UploadCloud, Image as ImageIcon
} from 'lucide-react';
// Importações do Firebase
import { auth, db, storage } from './firebaseClientConfig.js'; // Adicionado 'storage'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Funções do Storage

const API_BASE_URL = 'https://doceria-crm-backend.onrender.com/api';

// Hook customizado (sem alterações)
const useData = () => {
  const [data, setData] = useState({
    clientes: [],
    pedidos: [],
    produtos: [],
    despesas: [],
    fornecedores: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const fetchAndParse = async (url) => {
          const response = await fetch(url);
          if (!response.ok) {
              const errorBody = await response.text();
              console.error(`API Error on ${url}: ${response.status} ${response.statusText}`, errorBody);
              throw new Error(`Falha na requisição para ${url}`);
          }
          const jsonData = await response.json();
          return Array.isArray(jsonData) ? jsonData : [];
      };

      const [clientes, pedidos, produtos, despesas] = await Promise.all([
          fetchAndParse(`${API_BASE_URL}/clientes`),
          fetchAndParse(`${API_BASE_URL}/pedidos`),
          fetchAndParse(`${API_BASE_URL}/produtos`),
          fetchAndParse(`${API_BASE_URL}/despesas`),
      ]);

      setData({ clientes, pedidos, produtos, despesas, fornecedores: [] });
    } catch (error) {
      console.error("Erro ao carregar dados da API:", error);
      setData({ clientes: [], pedidos: [], produtos: [], despesas: [], fornecedores: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = async (section, item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const newItem = await response.json();
      setData(prev => ({
        ...prev,
        [section]: [...(prev[section] || []), newItem]
      }));
       return newItem;
    } catch (error) {
      console.error(`Erro ao adicionar item em ${section}:`, error);
    }
  };

  const updateItem = async (section, id, updatedItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${section}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const returnedItem = await response.json();
      setData(prev => ({
        ...prev,
        [section]: prev[section].map(item => (item.id === id ? returnedItem : item))
      }));
    } catch (error) {
      console.error(`Erro ao atualizar item em ${section}:`, error);
    }
  };

  const deleteItem = async (section, id) => {
    try {
       await fetch(`${API_BASE_URL}/${section}/${id}`, {
        method: 'DELETE',
      });
      setData(prev => ({
        ...prev,
        [section]: prev[section].filter(item => item.id !== id)
      }));
    } catch (error) {
      console.error(`Erro ao deletar item em ${section}:`, error);
    }
  };

  return { data, loading, addItem, updateItem, deleteItem };
};

// Componentes de UI reutilizáveis (sem alterações)
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClasses = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const Button = ({ children, variant = "primary", size = "md", onClick, className = "", disabled = false, type = "button" }) => {
  const baseClasses = "font-medium rounded-xl transition-all flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl",
  };
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3", lg: "px-8 py-4 text-lg" };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <input {...props} className={`w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-pink-500 focus:border-transparent ${error ? 'border-red-300' : 'border-gray-300'} ${className}`} />
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const Textarea = ({ label, error, className = "", ...props }) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea {...props} className={`w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-pink-500 focus:border-transparent ${error ? 'border-red-300' : 'border-gray-300'} ${className}`} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
);

const Select = ({ label, error, className = "", children, ...props }) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select {...props} className={`w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}>
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
);

const Table = ({ columns, data, actions = [] }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{col.header}</th>
            ))}
            {actions.length > 0 && <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(data || []).map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-rose-50/50 transition-all">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {actions.map((action, actionIndex) => (
                      <button key={actionIndex} onClick={() => action.onClick(row)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={action.label}>
                        <action.icon className="w-4 h-4 text-gray-600" />
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);


// Componente principal da aplicação
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('pagina-inicial');
  const { data, loading, addItem, updateItem, deleteItem } = useData();
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, section: null, id: null });
  const [generatedContent, setGeneratedContent] = useState({ isOpen: false, title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Novos estados para autenticação
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Efeito para ouvir o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ auth: authUser, role: userDoc.data().role || 'visitante' });
        } else {
          setUser({ auth: authUser, role: 'visitante' });
        }
        setCurrentPage('dashboard');
      } else {
        setUser(null);
        setCurrentPage('pagina-inicial');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setLoginError('');
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error("Erro de login:", error.code);
      setLoginError('Email ou senha inválidos.');
    }
  };
  
  const handleRegister = async () => {
    try {
        setLoginError('');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        await setDoc(doc(db, "users", newUser.uid), {
            email: newUser.email,
            role: "visitante"
        });

        setShowLogin(false);
        setEmail('');
        setPassword('');
    } catch (error) {
        console.error("Erro de registro:", error.code);
        if (error.code === 'auth/email-already-in-use') {
            setLoginError('Este email já está em uso.');
        } else {
            setLoginError('Erro ao registrar. Tente novamente.');
        }
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const allMenuItems = [
    { id: 'pagina-inicial', label: 'Página Inicial', icon: Home, roles: ['admin', 'visitante', null] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'visitante'] },
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['admin', 'visitante'] },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, roles: ['admin', 'visitante'] },
    { id: 'produtos', label: 'Produtos', icon: Package, roles: ['admin', 'visitante'] },
    { id: 'agenda', label: 'Agenda', icon: Calendar, roles: ['admin', 'visitante'] },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck, roles: ['admin', 'visitante'] },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin', 'visitante'] },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin'] },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, roles: ['admin'] },
  ];

  const currentUserRole = user ? user.role : null;
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUserRole));


  // Função para chamar a API Gemini
  const callGeminiAPI = async (prompt) => {
    setIsLoading(true);
    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        return result.candidates[0].content.parts[0].text;
      } else {
        return "Não foi possível gerar o conteúdo.";
      }
    } catch (error) {
      console.error("Erro ao chamar a API Gemini:", error);
      return "Ocorreu um erro ao tentar gerar o conteúdo.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = (section, id) => {
    setConfirmDelete({ isOpen: true, section, id });
  };

  const executeDelete = async () => {
    if (confirmDelete.section && confirmDelete.id) {
      await deleteItem(confirmDelete.section, confirmDelete.id);
    }
    setConfirmDelete({ isOpen: false, section: null, id: null });
  };
  
  // Componente ImageSlider
  const ImageSlider = ({ images, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, [images.length]);

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);
    
    return (
        <div className="h-64 md:h-96 w-full m-auto relative group rounded-2xl overflow-hidden shadow-lg">
            <div style={{ backgroundImage: `url(${images[currentIndex]})` }} className="w-full h-full bg-center bg-cover duration-500 cursor-pointer" onClick={() => onImageClick(images[currentIndex])}></div>
        </div>
    );
  };

  // Componente PaginaInicial
  const PaginaInicial = () => {
    const slideImages = [
        '/slide/slide1.png',
        '/slide/slide2.png',
        '/slide/slide3.png',
    ];

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
                            <Instagram size={20} />
                            @anaguimaraes.doceria
                        </a>
                        <a href="https://wa.me/5562991056075" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 font-semibold hover:underline">
                            <MessageCircle size={20} />
                            (62) 99105-6075
                        </a>
                        <p className="flex items-center gap-2 text-gray-700">
                            <MapPin size={20} />
                            Av. Comercial, 433 - Jardim Nova Esperanca, Goiânia - GO
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
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.890300951331!2d-49.3274707!3d-16.6725019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ef50062f12789%3A0x5711296a03567da3!2sAna%20Guimar%C3%A3es%20doceria!5e0!3m2!1spt-BR!2sbr!4v1661282662551!5m2!1spt-BR!2sbr"
                        width="100%" 
                        height="300" 
                        style={{border:0}} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-lg shadow-md"
                        title="Localização da Doceria"
                    ></iframe>
                </div>
            </div>
        </div>
      </div>
    );
  };

  // Componente Dashboard
  const Dashboard = () => {
    const totalVendas = (data.pedidos || []).reduce((acc, pedido) => acc + (pedido.total || 0), 0);
    const pedidosPendentes = (data.pedidos || []).filter(p => p.status === 'Pendente').length;
    const clientesAtivos = (data.clientes || []).length;

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral da sua doceria</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg"><TrendingUp className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Vendas Totais</p><h2 className="text-2xl font-bold text-gray-800">R$ {totalVendas.toFixed(2)}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><Heart className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Clientes ativos</p><h2 className="text-2xl font-bold text-gray-800">{clientesAtivos}</h2></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-lg"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Clock className="w-6 h-6 text-white" /></div><div><p className="text-gray-500 text-sm font-medium">Pedidos pendentes</p><h2 className="text-2xl font-bold text-gray-800">{pedidosPendentes}</h2></div></div></div>
        </div>
      </div>
    );
  };

  // Componente Clientes
  const Clientes = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({ nome: "", email: "", telefone: "", endereco: "", aniversario: "", status: "Ativo" });

    const filteredClients = (data.clientes || []).filter(c => 
        (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const resetForm = () => {
        setShowModal(false);
        setEditingClient(null);
        setFormData({ nome: "", email: "", telefone: "", endereco: "", aniversario: "", status: "Ativo" });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (editingClient) {
        await updateItem('clientes', editingClient.id, formData);
      } else {
        await addItem('clientes', { ...formData, totalCompras: 0, ultimaCompra: new Date().toISOString().split('T')[0] });
      }
      resetForm();
    };

    const handleEdit = (client) => {
      setEditingClient(client);
      setFormData(client);
      setShowModal(true);
    };

    const handleGenerateBirthdayMessage = async (client) => {
        const prompt = `Crie uma mensagem de aniversário curta e amigável para um cliente chamado ${client.nome}. O cliente tem o status "${client.status}" na nossa doceria. A mensagem deve ser calorosa e convidativa.`;
        const message = await callGeminiAPI(prompt);
        setGeneratedContent({ isOpen: true, title: `Mensagem para ${client.nome}`, content: message });
    };

    const columns = [
      { header: "Cliente", render: (row) => (<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-md">{row.nome.charAt(0).toUpperCase()}</div><div><p className="font-semibold text-gray-800">{row.nome}</p><p className="text-sm text-gray-500">{row.email}</p></div></div>) },
      { header: "Telefone", render: (row) => (<div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{row.telefone}</span></div>) },
      { header: "Total Compras", render: (row) => (<span className="font-semibold text-green-600">R$ {(row.totalCompras || 0).toFixed(2)}</span>) },
      { header: "Última Compra", render: (row) => new Date(row.ultimaCompra).toLocaleDateString('pt-BR') },
      { header: "Status", render: (row) => (<span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{row.status}</span>) }
    ];
    const actions = [
      { icon: Sparkles, label: "Gerar Mensagem de Aniversário", onClick: handleGenerateBirthdayMessage },
      { icon: Eye, label: "Visualizar", onClick: (row) => console.log("Ver", row) },
      { icon: Edit, label: "Editar", onClick: handleEdit },
      { icon: Trash2, label: "Excluir", onClick: (row) => handleDeleteRequest('clientes', row.id) }
    ];

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Gestão de Clientes</h1>
            <p className="text-gray-600 mt-1">Gerencie seus clientes e relacionamentos</p>
          </div>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Novo Cliente</Button>
        </div>
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-md" />
        </div>
        <Table columns={columns} data={filteredClients} actions={actions} />
        <Modal isOpen={showModal} onClose={resetForm} title={editingClient ? "Editar Cliente" : "Novo Cliente"} size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Nome Completo" type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <Input label="Telefone" type="tel" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
              <Input label="Data de Aniversário" type="date" value={formData.aniversario} onChange={(e) => setFormData({...formData, aniversario: e.target.value})} />
            </div>
            <Input label="Endereço" type="text" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={resetForm}>Cancelar</Button>
              <Button type="submit"><Save className="w-4 h-4" />{editingClient ? "Salvar Alterações" : "Criar Cliente"}</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }
  
  // Componente Produtos
  const Produtos = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ nome: "", categoria: "Delivery", preco: "", custo: "", estoque: "", status: "Ativo", descricao: "", tempoPreparo: "" });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const filteredProducts = (data.produtos || []).filter(p => 
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const resetForm = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({ nome: "", categoria: "Delivery", preco: "", custo: "", estoque: "", status: "Ativo", descricao: "", tempoPreparo: "", imageUrl: "" });
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsUploading(true);

      let imageUrl = formData.imageUrl || "";

      if (imageFile) {
        const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      const productData = { 
          ...formData, 
          preco: parseFloat(formData.preco || 0), 
          custo: parseFloat(formData.custo || 0), 
          estoque: parseInt(formData.estoque || 0),
          imageUrl: imageUrl
      };

      if (editingProduct) {
        await updateItem('produtos', editingProduct.id, productData);
      } else {
        await addItem('produtos', productData);
      }
      setIsUploading(false);
      resetForm();
    };

    const handleEdit = (product) => {
      setEditingProduct(product);
      setFormData({ ...product, preco: String(product.preco), custo: String(product.custo), estoque: String(product.estoque) });
      setImagePreview(product.imageUrl || null);
      setShowModal(true);
    };

    const handleGenerateDescription = async () => {
        if (!formData.nome || !formData.categoria) {
            alert("Por favor, preencha o nome e a categoria do produto primeiro.");
            return;
        }
        const prompt = `Crie uma descrição de produto curta e atraente para um(a) "${formData.nome}" da categoria "${formData.categoria}" de uma doceria. A descrição deve ser apetitosa e destacar a qualidade.`;
        const description = await callGeminiAPI(prompt);
        setFormData(prev => ({ ...prev, descricao: description }));
    };

    const columns = [
      { header: "Produto", render: (row) => (
          <div className="flex items-center gap-3">
              <img 
                src={row.imageUrl || 'https://placehold.co/40x40/FFC0CB/FFFFFF?text=Doce'} 
                alt={row.nome} 
                className="w-10 h-10 rounded-xl object-cover shadow-md"
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/FFC0CB/FFFFFF?text=Erro'; }}
              />
              <div>
                <p className="font-semibold text-gray-800">{row.nome}</p>
                <p className="text-sm text-gray-500">{row.categoria}</p>
              </div>
          </div>
      )},
      { header: "Preço", render: (row) => <span className="font-semibold text-green-600">R$ {(row.preco || 0).toFixed(2)}</span> },
      { header: "Estoque", render: (row) => <span className={`font-medium ${row.estoque < 10 ? 'text-red-600' : 'text-gray-800'}`}>{row.estoque} un</span> },
      { header: "Status", render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.status}</span> }
    ];
    const actions = [
        { icon: Eye, label: "Visualizar", onClick: (row) => console.log("Ver", row) },
        { icon: Edit, label: "Editar", onClick: handleEdit },
        { icon: Trash2, label: "Excluir", onClick: (row) => handleDeleteRequest('produtos', row.id) }
    ];

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-pink-50/30 to-rose-50/30 min-h-screen">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Gestão de Produtos</h1>
                <p className="text-gray-600 mt-1">Gerencie seu cardápio e estoque</p>
            </div>
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Novo Produto</Button>
        </div>
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-md" />
        </div>
        <Table columns={columns} data={filteredProducts} actions={actions} />
        <Modal isOpen={showModal} onClose={resetForm} title={editingProduct ? "Editar Produto" : "Novo Produto"} size="xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nome do Produto" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
                        <Select label="Categoria" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} required>
                          <option value="Delivery">Delivery</option>
                          <option value="Festa">Festa</option>
                        </Select>
                        <Input label="Preço (R$)" type="number" step="0.01" value={formData.preco} onChange={(e) => setFormData({...formData, preco: e.target.value})} />
                        <Input label="Custo (R$)" type="number" step="0.01" value={formData.custo} onChange={(e) => setFormData({...formData, custo: e.target.value})} />
                        <Input label="Estoque" type="number" value={formData.estoque} onChange={(e) => setFormData({...formData, estoque: e.target.value})} />
                        <Input label="Tempo de Preparo" value={formData.tempoPreparo} onChange={(e) => setFormData({...formData, tempoPreparo: e.target.value})} />
                    </div>
                     <div className="relative">
                        <Textarea label="Descrição" rows="3" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} />
                        <Button size="sm" variant="secondary" onClick={handleGenerateDescription} disabled={isLoading} className="absolute right-2 bottom-9">
                            <Sparkles className="w-4 h-4" />
                            {isLoading ? 'Gerando...' : '✨ Gerar'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Foto do Produto</label>
                    <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-center p-4">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Pré-visualização" className="max-h-full max-w-full object-contain rounded-lg"/>
                        ) : (
                            <div className="text-gray-500">
                                <ImageIcon className="mx-auto h-12 w-12" />
                                <p className="mt-2 text-sm">Clique para selecionar</p>
                            </div>
                        )}
                    </div>
                    <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
                </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={isUploading}><Save className="w-4 h-4" />{isUploading ? 'Salvando...' : (editingProduct ? "Salvar Alterações" : "Criar Produto")}</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }
  
  // Componentes Placeholder
  const PlaceholderPage = ({ title }) => (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-pink-600">{title}</h1>
      <p className="text-gray-600 mt-2">Funcionalidade em desenvolvimento...</p>
    </div>
  );

  const renderCurrentPage = () => {
    if (authLoading || (loading && user)) {
      return (
        <div className="flex h-full w-full items-center justify-center">
            <p className="text-lg text-gray-500">Carregando...</p>
        </div>
      );
    }
    
    switch (currentPage) {
      case 'pagina-inicial': return <PaginaInicial />;
      case 'dashboard': return user ? <Dashboard /> : <PaginaInicial />;
      case 'clientes': return user ? <Clientes /> : <PaginaInicial />;
      case 'pedidos': return user ? <PlaceholderPage title="Pedidos" /> : <PaginaInicial />;
      case 'produtos': return user ? <Produtos /> : <PaginaInicial />;
      case 'agenda': return user ? <PlaceholderPage title="Agenda" /> : <PaginaInicial />;
      case 'fornecedores': return user ? <PlaceholderPage title="Fornecedores" /> : <PaginaInicial />;
      case 'financeiro': return user?.role === 'admin' ? <PlaceholderPage title="Financeiro" /> : <PaginaInicial />;
      case 'relatorios': return user ? <PlaceholderPage title="Relatórios" /> : <PaginaInicial />;
      case 'configuracoes': return user?.role === 'admin' ? <PlaceholderPage title="Configurações" /> : <PaginaInicial />;
      default: return <PaginaInicial />;
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
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
            <Search className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar..." className="bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
            <div className="relative">
              <button onClick={() => { if(!user) setShowLogin(true) }} className="p-2 rounded-full hover:bg-gray-100">
                <User className="w-6 h-6 text-gray-600" />
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

      <Modal isOpen={confirmDelete.isOpen} onClose={() => setConfirmDelete({ isOpen: false, section: null, id: null })} title="Confirmar Exclusão" size="sm">
        <div className="space-y-6">
            <p className="text-gray-600">Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setConfirmDelete({ isOpen: false, section: null, id: null })}>Cancelar</Button>
                <Button variant="danger" onClick={executeDelete}>Excluir</Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={generatedContent.isOpen} onClose={() => setGeneratedContent({ isOpen: false, title: '', content: '' })} title={generatedContent.title} size="md">
        <div className="space-y-4">
            <p className="text-gray-700 whitespace-pre-wrap">{generatedContent.content}</p>
            <div className="flex justify-end">
                <Button onClick={() => setGeneratedContent({ isOpen: false, title: '', content: '' })}>Fechar</Button>
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

