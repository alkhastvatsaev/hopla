
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, User } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

interface JobChatProps {
  jobId: string;
  role: 'client' | 'driver';
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'client' | 'driver';
  createdAt: any;
  jobId: string;
}

export default function JobChat({ jobId, role, onClose }: JobChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!jobId) return;

    const q = query(
      collection(db, 'job_chats'),
      where('jobId', '==', jobId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
      
      // Browser Notification for new messages
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.sender !== role && document.hidden) {
        if (Notification.permission === 'granted') {
          new Notification('Nouveau message Hopla', {
            body: lastMsg.text,
            icon: '/favicon.ico'
          });
        }
      }
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, [jobId, role]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const QUICK_ACTIONS: Record<string, string[]> = {
    client: ['Merci !', 'Je suis en bas', 'À quel étage ?', 'Vous êtes où ?', 'Prenez votre temps'],
    driver: ['Je suis en route', 'J\'arrive dans 5 min', 'Je suis arrivé', 'Article indisponible', 'Besoin de précisions']
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !jobId) return;

    try {
      await addDoc(collection(db, 'job_chats'), {
        jobId,
        text: input,
        sender: role,
        createdAt: serverTimestamp(),
      });
      setInput('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const sendQuickMessage = async (text: string) => {
    if (!jobId) return;
    try {
      await addDoc(collection(db, 'job_chats'), {
        jobId,
        text,
        sender: role,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending quick message: ", error);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '0', left: '0', right: '0', top: '0',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
      zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div className="animate-enter" style={{
        width: '100%', maxWidth: '500px', height: '90vh',
        background: 'white', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 -20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #f2f2f7',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {role === 'client' ? <User size={20} color="#007AFF" /> : <MessageCircle size={20} color="#34c759" />}
            </div>
            <div>
               <div style={{ fontWeight: '700', fontSize: '17px' }}>{role === 'client' ? 'Votre Livreur' : 'Votre Client'}</div>
               <div style={{ fontSize: '13px', color: '#34c759', fontWeight: '600' }}>En ligne • Temps réel</div>
            </div>
          </div>
          <button onClick={onClose} style={{ 
            background: '#f2f2f7', border: 'none', borderRadius: '50%', 
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#86868b'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f5f5f7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#86868b' }}>
               <div style={{ fontSize: '40px', marginBottom: '16px' }}>💬</div>
               <div style={{ fontWeight: '600', fontSize: '15px' }}>Engagez la conversation !</div>
               <div style={{ fontSize: '13px' }}>Précisez un détail ou envoyez un merci.</div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} style={{
              alignSelf: msg.sender === role ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.sender === role ? '#007AFF' : 'white',
              color: msg.sender === role ? 'white' : '#1d1d1f',
              padding: '14px 18px', borderRadius: '22px',
              fontSize: '15px', lineHeight: '1.4',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              borderBottomRightRadius: msg.sender === role ? '4px' : '22px',
              borderBottomLeftRadius: msg.sender === role ? '22px' : '4px'
            }}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '8px 16px', background: 'white', borderTop: '1px solid #f2f2f7', display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {QUICK_ACTIONS[role]?.map((action) => (
            <button
              key={action}
              onClick={() => sendQuickMessage(action)}
              style={{
                padding: '8px 14px', borderRadius: '20px',
                border: '1.5px solid #E5E5EA', background: '#F9F9FB',
                fontSize: '13px', fontWeight: '600', color: '#007AFF',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s'
              }}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{ padding: '24px', background: 'white', paddingBottom: '40px' }}>
           <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
             <input 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Tapez votre message..."
               style={{ 
                 flex: 1, padding: '16px 20px', borderRadius: '24px', 
                 border: '2px solid #f2f2f7', background: '#f9f9fb',
                 fontSize: '16px', outline: 'none'
               }}
             />
             <button type="submit" disabled={!input.trim()} style={{
               width: '52px', height: '52px', borderRadius: '50%',
               background: input.trim() ? '#007AFF' : '#d2d2d7', color: 'white',
               border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
               cursor: 'pointer', transition: 'all 0.2s'
             }}>
               <Send size={24} />
             </button>
           </form>
        </div>
      </div>
    </div>
  );
}
