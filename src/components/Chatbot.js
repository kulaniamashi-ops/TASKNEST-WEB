import React, { useState } from 'react';

// Simple SVG icons to replace react-icons
const TimesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

const RobotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.75 3.75v4.5m0-4.5h-7.5v4.5h7.5v-4.5zM15.75 15.75H3.75v-4.5h12v4.5zm0-4.5v4.5m0-4.5h4.5v4.5h-4.5v-4.5zM3.375 8.25c-.621 0-1.125.504-1.125 1.125v7.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-7.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your TaskNest AI assistant. How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Add user message
    setMessages([...messages, { text: inputText, sender: 'user' }]);
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          text: "I'm still learning, but I can help you find services or answer basic questions about TaskNest!", 
          sender: 'bot' 
        }
      ]);
    }, 1000);
    
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl z-20 overflow-hidden border border-green-300">
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 text-white flex justify-between items-center">
        <h3 className="font-bold flex items-center">
          <RobotIcon className="mr-2" /> TaskNest AI Assistant
        </h3>
        <button onClick={onClose} className="text-white hover:text-green-200">
          <TimesIcon />
        </button>
      </div>
      <div className="p-4 bg-gray-50 h-64 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-3 ${message.sender === 'user' ? 'text-right' : ''}`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-200">
        <div className="flex">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-green-600 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;