import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Users, Zap, Globe, Github, Linkedin, Mail, ArrowRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3001';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: `${username}'s Room` }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('username', username);
        navigate(`/editor/${data.roomId}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = () => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    localStorage.setItem('username', username);
    navigate(`/editor/${roomId}`);
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-time Syncing',
      description: 'See changes instantly as you and your team code together'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Live Cursors',
      description: 'Track where everyone is working with colored cursor indicators'
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: 'Multi-language Support',
      description: 'Syntax highlighting for JavaScript, Python, C++, and more'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Auto-save & Persistence',
      description: 'Your code is automatically saved and restored when you return'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="px-6 py-4 backdrop-blur-sm bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="w-8 h-8 text-emerald-500" />
            <span className="text-2xl font-bold text-white">CodeTogether</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
            <a href="https://github.com" className="text-slate-300 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Collaborative Code Editing.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500"> Live.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
              Join, code, and build — together. Experience the future of collaborative development with real-time editing, live cursors, and seamless synchronization.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            {/* Create Room Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
              <h3 className="text-2xl font-semibold text-white mb-4">Create New Room</h3>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 rounded-lg text-white placeholder-slate-400 border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all mb-4"
              />
              <button
                onClick={createRoom}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Create Room</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Join Room Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <h3 className="text-2xl font-semibold text-white mb-4">Join Existing Room</h3>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 rounded-lg text-white placeholder-slate-400 border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all mb-4"
              />
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 rounded-lg text-white placeholder-slate-400 border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all mb-4"
              />
              <button
                onClick={joinRoom}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 group"
              >
                <span>Join Room</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="px-6 py-20 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Powerful Features</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Everything you need for seamless collaborative coding, built with modern web technologies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 group"
              >
                <div className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-12 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Code2 className="w-6 h-6 text-emerald-500" />
              <span className="text-lg font-semibold text-white">CodeTogether</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="https://github.com" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:hello@codetogether.dev" className="text-slate-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400">
              Made with ❤️ using React, Node.js, Socket.io, and SQLite
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;