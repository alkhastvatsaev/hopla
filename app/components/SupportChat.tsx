'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, Send, X, Headphones } from 'lucide-react';
import { db } from '../lib/firebase'; // Ensure firebase is initialized
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isTracking = pathname?.includes('/tracking/');

  const positionStyle: React.CSSProperties = isTracking 
    ? { top: '20px', right: '80px', bottom: 'auto' }
    : { bottom: '40px', right: '40px', top: 'auto' };

  useEffect(() => {
    // Generate or retrieve a consistent user ID for the chat session
    let storedId = localStorage.getItem('hopla_chat_user_id');
    if (!storedId) {
      storedId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('hopla_chat_user_id', storedId);
    }
    setUserId(storedId);
  }, []);

  useEffect(() => {
    if (!userId || !isOpen) return;

    // Listen to messages for this user
    const q = query(
      collection(db, 'support_messages'),
      where('conversationId', '==', userId), // Simple conversation grouping by user ID
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [userId, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    try {
      await addDoc(collection(db, 'support_messages'), {
        text: input,
        sender: 'user',
        conversationId: userId,
        createdAt: serverTimestamp(),
        read: false
      });
      setInput('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="hover-scale"
        style={{
          position: 'fixed', 
          ...positionStyle,
          width: '50px', height: '50px', borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: '#007AFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.4)', 
          cursor: 'pointer', zIndex: 10000,
          transition: 'transform 0.2s'
        }}>
        <MessageCircle size={24} strokeWidth={2} />
      </button>
    );
  }

  return (
    <div className="animate-enter" style={{
      position: 'fixed', 
      ...positionStyle,
      width: '350px', maxHeight: '500px', height: '80vh',
      background: 'white', borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column',
      zIndex: 10001, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px', background: '#007AFF', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#34c759', borderRadius: '50%' }}></div>
          <span style={{ fontWeight: '600' }}>Support Hopla</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f5f5f7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Empty state removed */}
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: msg.sender === 'user' ? '#007AFF' : 'white',
            color: msg.sender === 'user' ? 'white' : '#1d1d1f',
            padding: '10px 14px', borderRadius: '18px',
            fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px',
            borderBottomLeftRadius: msg.sender === 'user' ? '18px' : '4px'
          }}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '12px', background: 'white', borderTop: '1px solid #f2f2f7', display: 'flex', gap: '8px' }}>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..."
          style={{
            flex: 1, padding: '10px 16px', borderRadius: '20px',
            border: '1px solid #e5e5ea', outline: 'none', fontSize: '14px'
          }}
        />
        <button type="submit" disabled={!input.trim()} style={{
          background: input.trim() ? '#007AFF' : '#d2d2d7', color: 'white', 
          width: '36px', height: '36px', borderRadius: '50%', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s'
        }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
