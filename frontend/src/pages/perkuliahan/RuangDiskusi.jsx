import React, { useState, useEffect, useRef } from 'react';
import { api, getStoredToken } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { SidebarMenu } from '../../components/SidebarMenu.jsx';
import { Send, Users, User, Plus, MessageCircle, Info, Menu, X } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { Button } from '../../components/ui.jsx';

// Helper function untuk mengambil nama dari entitas user
const getUserName = (u) => u?.dosen?.nama || u?.mahasiswa?.nama || u?.prodiKelola?.namaProdi || u?.username || 'Unknown';

export default function RuangDiskusi() {
  const { user } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // State chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State info grup
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState([]);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // State pembuatan room baru
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatType, setChatType] = useState('PERSONAL');
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchChatHistory(selectedRoom.id);
      
      const newSocket = io('http://localhost:3000', {
        auth: { token: getStoredToken() }
      });
      
      newSocket.on('connect', () => {
        newSocket.emit('join_room', selectedRoom.id);
      });
      
      newSocket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });
      
      newSocket.on('connect_error', (err) => {
        toast.error('Gagal terhubung ke server chat: ' + err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit('leave_room', selectedRoom.id);
        newSocket.disconnect();
      };
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await api.get('/diskusi/rooms');
      setRooms(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat daftar chat');
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get('/diskusi/users');
      setAvailableUsers(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat daftar pengguna');
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const res = await api.get('/diskusi/kelas');
      setAvailableClasses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatHistory = async (roomId) => {
    try {
      const res = await api.get(`/diskusi/rooms/${roomId}/messages`);
      setMessages(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat riwayat diskusi');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !selectedRoom) return;
    
    socket.emit('send_message', {
      roomId: selectedRoom.id,
      message: newMessage.trim()
    });
    
    setNewMessage('');
  };

  const handleOpenNewChat = () => {
    fetchAvailableUsers();
    if (user.role !== 'MAHASISWA') fetchAvailableClasses();
    setChatType('PERSONAL');
    setGroupName('');
    setSelectedUserIds([]);
    setSelectedClassId('');
    setShowNewChatModal(true);
  };

  const handleCreateChat = async () => {
    if (chatType !== 'CLASS' && selectedUserIds.length === 0) {
      return toast.error('Pilih minimal 1 orang');
    }
    if (chatType === 'GROUP' && !groupName) {
      return toast.error('Nama grup harus diisi');
    }
    if (chatType === 'CLASS' && !selectedClassId) {
      return toast.error('Pilih kelas terlebih dahulu');
    }

    try {
      const res = await api.post('/diskusi/rooms', {
        type: chatType,
        name: chatType === 'GROUP' ? groupName : null,
        targetUserIds: selectedUserIds,
        kelasId: selectedClassId
      });
      toast.success('Ruang obrolan berhasil dibuat');
      setShowNewChatModal(false);
      fetchRooms();
      setSelectedRoom(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal membuat chat');
    }
  };

  const toggleUserSelection = (id) => {
    if (chatType === 'PERSONAL') {
      setSelectedUserIds([id]);
    } else {
      setSelectedUserIds(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
    }
  };

  const handleAddMembers = async () => {
    if (newMemberIds.length === 0) return toast.error('Pilih pengguna terlebih dahulu');
    try {
      const res = await api.post(`/diskusi/rooms/${selectedRoom.id}/members`, { newMemberIds });
      toast.success('Anggota berhasil ditambahkan');
      setSelectedRoom(res.data.data);
      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? res.data.data : r));
      setIsAddingMember(false);
      setNewMemberIds([]);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal menambahkan anggota');
    }
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const res = await api.delete(`/diskusi/rooms/${selectedRoom.id}/members/${memberToRemove}`);
      toast.success('Anggota berhasil dikeluarkan');
      setSelectedRoom(res.data.data);
      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? res.data.data : r));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Gagal mengeluarkan anggota');
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleOpenGroupInfo = () => {
    setIsAddingMember(false);
    setNewMemberIds([]);
    setShowGroupInfoModal(true);
  };

  // Menentukan nama yang ditampilkan untuk sebuah room di sidebar
  const getRoomDisplayName = (room) => {
    if (room.type === 'GROUP' || room.type === 'CLASS') return room.name;
    // Jika personal, cari member yang BUKAN diri kita
    const otherMember = room.members.find(m => m.userId !== user.id);
    return otherMember ? getUserName(otherMember.user) : 'Unknown User';
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start h-[calc(100vh-8rem)]">
      <SidebarMenu currentGroup="Perkuliahan" />
      
      <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm flex overflow-hidden h-full relative">
        
        {/* Overlay saat drawer terbuka di mobile */}
        {isDrawerOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-10 md:hidden" 
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Kolom Kiri: Daftar Chat (Drawer di Mobile) */}
        <div className={`w-80 md:w-1/3 absolute md:relative z-20 h-full border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Ruang Diskusi</h2>
              <p className="text-xs text-slate-500">Pesan personal & grup</p>
            </div>
            <button 
              onClick={handleOpenNewChat}
              className="w-8 h-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center hover:bg-sky-200 transition-colors"
              title="Obrolan Baru"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingRooms ? (
              <div className="px-2 text-sm text-slate-400 p-4 text-center">Memuat obrolan...</div>
            ) : rooms.length === 0 ? (
              <div className="px-2 text-sm text-slate-400 italic text-center p-4">Belum ada obrolan</div>
            ) : (
              rooms.map(room => (
                <button 
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                    setIsDrawerOpen(false); // Tutup drawer setelah memilih chat di mobile
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors ${selectedRoom?.id === room.id ? 'bg-sky-100' : 'hover:bg-slate-200'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${room.type !== 'PERSONAL' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                    {room.type !== 'PERSONAL' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-semibold text-slate-800 text-sm truncate">{getRoomDisplayName(room)}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {room.messages && room.messages.length > 0 ? room.messages[0].message : 'Belum ada pesan'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Kolom Kanan: Area Chatting */}
        <div className="flex-1 flex flex-col h-full bg-slate-100/50 relative w-full">
          {selectedRoom ? (
            <>
              {/* Header Chat */}
              <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsDrawerOpen(true)}
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedRoom.type !== 'PERSONAL' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                    {selectedRoom.type !== 'PERSONAL' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{getRoomDisplayName(selectedRoom)}</h3>
                    {selectedRoom.type !== 'PERSONAL' ? (
                      <button 
                        onClick={handleOpenGroupInfo}
                        className="text-xs text-sky-600 hover:text-sky-700 font-medium hover:underline flex items-center gap-1 mt-0.5"
                      >
                        {selectedRoom.members.length} anggota <Info className="w-3 h-3" />
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">Personal Chat</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Pesan-pesan */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <div className="p-4 bg-slate-200 rounded-full"><MessageCircle className="w-8 h-8" /></div>
                    <p className="text-sm font-medium">Belum ada diskusi di ruangan ini.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender.id === user.id;
                    const showHeader = selectedRoom.type !== 'PERSONAL';
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full mb-1`}>
                        {showHeader && (
                          <span className={`text-[10px] font-bold mb-1 ${isMe ? 'mr-1 text-sky-600' : 'ml-1 text-slate-500'}`}>
                            {isMe ? 'Anda' : getUserName(msg.sender)} <span className="font-normal opacity-70">({msg.sender.role})</span>
                          </span>
                        )}
                        <div className={`px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${isMe ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Box */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 px-4 py-2.5 bg-slate-100 border-transparent focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200 rounded-full text-sm outline-none transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3 bg-sky-600 text-white rounded-full hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 relative">
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden absolute top-4 left-4 p-2 text-slate-500 hover:text-slate-800 bg-white shadow-sm border rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <MessageCircle className="w-16 h-16 opacity-20" />
              <p>Pilih chat dari samping atau mulai obrolan baru.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Obrolan Baru */}
      <Modal open={showNewChatModal} onClose={() => setShowNewChatModal(false)} title="Mulai Diskusi Baru">
        <div className="space-y-4">
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => { setChatType('PERSONAL'); setSelectedUserIds([]); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${chatType === 'PERSONAL' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Personal
            </button>
            {user.role !== 'MAHASISWA' && (
              <>
                <button
                  onClick={() => { setChatType('GROUP'); setSelectedUserIds([]); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${chatType === 'GROUP' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Grup Custom
                </button>
                <button
                  onClick={() => { setChatType('CLASS'); setSelectedUserIds([]); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${chatType === 'CLASS' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Grup Kelas
                </button>
              </>
            )}
          </div>

          {chatType === 'CLASS' && (
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Pilih Kelas<span className="text-red-500 ml-1">*</span></label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              >
                <option value="">-- Pilih Kelas yang Anda Ajar --</option>
                {availableClasses.map(k => (
                  <option key={k.id} value={k.id}>{k.namaKelas}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-2">Semua mahasiswa di kelas ini akan otomatis dimasukkan ke dalam grup.</p>
            </div>
          )}

          {chatType === 'GROUP' && (
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Grup<span className="text-red-500 ml-1">*</span></label>
              <input 
                type="text" 
                value={groupName} 
                onChange={e => setGroupName(e.target.value)}
                placeholder="Contoh: Diskusi Keamanan Jaringan"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          )}

          {chatType !== 'CLASS' && (
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Pilih Pengguna<span className="text-red-500 ml-1">*</span></label>
              <div className="max-h-60 overflow-y-auto border rounded-lg divide-y bg-slate-50">
                {availableUsers.map(u => (
                  <div key={u.id} className="p-2 flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <div className="font-medium text-sm text-slate-800">{getUserName(u)}</div>
                      <div className="text-xs text-slate-500">{u.role}</div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={selectedUserIds.includes(u.id)}
                      onChange={() => toggleUserSelection(u.id)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                  </div>
                ))}
                {availableUsers.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-400">Tidak ada pengguna ditemukan</div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button onClick={handleCreateChat} variant="primary">
              Mulai Diskusi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Info Grup */}
      <Modal open={showGroupInfoModal} onClose={() => setShowGroupInfoModal(false)} title={isAddingMember ? "Tambah Anggota Grup" : "Informasi Anggota Grup"}>
        {selectedRoom && !isAddingMember && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border rounded-lg text-center relative">
              <h3 className="font-bold text-slate-800">{getRoomDisplayName(selectedRoom)}</h3>
              <p className="text-xs text-slate-500">{selectedRoom.members.length} Anggota</p>
              
              {selectedRoom.type === 'GROUP' && selectedRoom.members.find(m => m.userId === user.id)?.role === 'ADMIN' && (
                <button 
                  onClick={() => {
                    fetchAvailableUsers();
                    setIsAddingMember(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded hover:bg-sky-200 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto divide-y border rounded-lg">
              {selectedRoom.members.map(member => {
                const isMe = member.userId === user.id;
                const isAdmin = selectedRoom.members.find(m => m.userId === user.id)?.role === 'ADMIN';
                const canRemove = selectedRoom.type === 'GROUP' && isAdmin && !isMe;
                
                return (
                  <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800 flex items-center gap-2">
                          {isMe ? 'Anda' : getUserName(member.user)}
                          {isMe && <span className="text-[9px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">Me</span>}
                        </div>
                        <div className="text-xs text-slate-500">{member.user.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'ADMIN' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase">
                          Admin
                        </span>
                      )}
                      {canRemove && (
                        <button 
                          onClick={() => setMemberToRemove(member.userId)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Keluarkan Anggota"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedRoom && isAddingMember && (
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y bg-slate-50">
              {availableUsers.filter(u => !selectedRoom.members.some(m => m.userId === u.id)).map(u => (
                <div key={u.id} className="p-2 flex items-center justify-between hover:bg-slate-100">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{getUserName(u)}</div>
                    <div className="text-xs text-slate-500">{u.role}</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={newMemberIds.includes(u.id)}
                    onChange={() => setNewMemberIds(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                </div>
              ))}
              {availableUsers.filter(u => !selectedRoom.members.some(m => m.userId === u.id)).length === 0 && (
                <div className="p-4 text-center text-sm text-slate-400">Semua pengguna sudah berada di grup ini</div>
              )}
            </div>

            <div className="pt-2 flex justify-between">
              <button 
                onClick={() => setIsAddingMember(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Kembali
              </button>
              <Button onClick={handleAddMembers} variant="primary" disabled={newMemberIds.length === 0}>
                Tambahkan ({newMemberIds.length})
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!memberToRemove}
        title="Keluarkan Anggota"
        message="Apakah Anda yakin ingin mengeluarkan anggota ini dari grup diskusi? Anda dapat menambahkannya kembali nanti."
        confirmLabel="Keluarkan"
        onConfirm={executeRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

    </div>
  );
}
