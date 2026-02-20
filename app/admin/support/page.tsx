'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Send, User, MessageSquare } from 'lucide-react';
import { RequireAdmin } from '../../components/RouteGuards';

export default function SupportAdmin() {
  const [conversations, setConversations] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all unique conversation IDs (users who messaged)
  useEffect(() => {
    // Ideally this should be a "conversations" collection, but we can query messages and deduplicate for MVP
    const q = query(collection(db, 'support_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.conversationId) users.add(data.conversationId);
      });
      setConversations(Array.from(users));
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
    const q = query(
      collection(db, 'support_messages'),
      orderBy('createdAt', 'asc') // Order by time
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(m => m.conversationId === selectedUser);
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });
    return () => unsubscribe();
  }, [selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;

    try {
      await addDoc(collection(db, 'support_messages'), {
        text: input,
        sender: 'admin',
        conversationId: selectedUser,
        createdAt: serverTimestamp(),
        read: false
      });
      setInput('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <RequireAdmin>
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f7', fontFamily: '-apple-system, sans-serif' }}>
      
      {/* Sidebar: Conversations List */}
      <div style={{ width: '300px', background: 'white', borderRight: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e5ea', fontWeight: '700', fontSize: '18px' }}>
          Support Admin
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(userId => (
             <div 
               key={userId}
               onClick={() => setSelectedUser(userId)}
               style={{
                 padding: '16px', borderBottom: '1px solid #f5f5f7', cursor: 'pointer',
                 background: selectedUser === userId ? '#f2f2f7' : 'white',
                 display: 'flex', alignItems: 'center', gap: '12px'
               }}
             >
                <div style={{ width: '40px', height: '40px', background: '#e5e5ea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#86868b" />
                </div>
                <div>
                   <div style={{ fontWeight: '600', fontSize: '14px' }}>Client {userId.substr(0, 6)}...</div>
                   <div style={{ fontSize: '12px', color: '#86868b' }}>Conversation active</div>
                </div>
             </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: '20px', color: '#86868b', textAlign: 'center', fontSize: '14px' }}>Aucune conversation</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #e5e5ea', fontWeight: '600' }}>
               Discussion avec {selectedUser}
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {messages.map(msg => (
                 <div key={msg.id} style={{
                   alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                   maxWidth: '60%',
                   padding: '12px 16px', borderRadius: '18px',
                   background: msg.sender === 'admin' ? '#007AFF' : 'white',
                   color: msg.sender === 'admin' ? 'white' : '#1d1d1f',
                   boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                   fontSize: '15px'
                 }}>
                   {msg.text}
                 </div>
               ))}
               <div ref={messagesEndRef} />
            </div>

            <form onSubmit={reply} style={{ padding: '20px', background: 'white', borderTop: '1px solid #e5e5ea', display: 'flex', gap: '12px' }}>
               <input 
                 autoFocus
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 placeholder="Répondre..."
                 style={{
                   flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e5e5ea', fontSize: '15px', outline: 'none'
                 }}
               />
               <button type="submit" style={{
                 background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', padding: '0 24px', fontWeight: '600', cursor: 'pointer'
               }}>
                 Envoyer
               </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#86868b' }}>
             <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
             <div>Sélectionnez un client à gauche pour répondre</div>
          </div>
        )}
      </div>

    </div>
    </RequireAdmin>
  );
}
