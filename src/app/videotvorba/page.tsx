"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../komplexaci.css';

export default function VideotvorbaPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Featured videos from the Komplexáci Gaming YouTube channel
  const featuredVideos = [
    {
      id: 'i3KL5t-EXPw',
      title: 'Komplexáci Gaming Intro (2025)',
      description: 'Nové intro našeho herního klanu pro rok 2025'
    },
    {
      id: '5UwzVCNvFvE',
      title: 'WWF Smackdown! Just Bring It - Royal Rumble',
      description: 'Retro wrestling gameplay v 1440p - epický Royal Rumble match'
    },
    {
      id: 'C4oJaAkDE4U',
      title: 'WWF Smackdown! 2 Know Your Role - Royal Rumble',
      description: 'PSX retro klasika s 3.2K views - Royal Rumble v 1440p'
    },
    {
      id: 'danDl9fUwAM',
      title: 'Trackmania Epic Battle',
      description: 'Napínavé závodní souboje v Trackmania'
    },
    {
      id: '2l-ZlM1rixM',
      title: 'KompG - Rocket League 2023',
      description: 'Rocket League highlights našeho klanu v 1440p'
    },
    {
      id: 'yQCLwKLRGWg',
      title: 'KompG - U.R.F Montage',
      description: 'League of Legends montáž s nejlepšími momenty'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="particles-bg"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-lg font-semibold">Zpět na hlavní stránku</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div 
            className={`text-center transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* YouTube Icon */}
            <div className="flex justify-center mb-8">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/50 hover:scale-110 transition-transform duration-300"
              >
                <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
            </div>

            <h1 
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              Videotvorba
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Sleduj náš YouTube kanál plný herního obsahu, vtipných momentů a nostalgických vzpomínek
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <a
                href="https://www.youtube.com/@MartinPenkava1337"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center px-8 py-4 rounded-full text-lg font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50"
                style={{
                  background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                  boxShadow: '0 10px 30px rgba(255, 0, 0, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <svg className="w-6 h-6 mr-3 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="relative z-10">Odebírat kanál</span>
              </a>

              <a
                href="https://www.youtube.com/@MartinPenkava1337/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 rounded-full text-lg font-semibold bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/50 hover:border-purple-400 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Všechna videa
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Channel Stats */}
      <section className="relative z-10 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "📺", label: "Video obsah", value: "Gaming & Zábava" },
                { icon: "🎮", label: "Zaměření", value: "Retro & Modern" },
                { icon: "🔥", label: "Komunita", value: "Komplexáci" }
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 150 + 500}ms` }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{stat.icon}</div>
                    <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Latest Video */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              🎉 Nejnovější video
            </h2>
            <p className="text-center text-gray-300 mb-12 text-lg">
              Podívejte se na naši nejnovější tvorbu!
            </p>
            
            {/* Main Featured Video - Latest Upload */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-500 mb-16">
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl shadow-red-500/20">
                <iframe
                  src="https://www.youtube.com/embed/5CnFK-7bRQc"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Best way to play Retro Wrestling Games on Windows"
                ></iframe>
              </div>
              <div className="mt-4 px-2">
                <h3 className="text-2xl font-bold text-white mb-2">Best way to play Retro Wrestling Games on Windows</h3>
                <p className="text-gray-400">Návod jak hrát retro wrestlingové hry na Windows - 118 views</p>
              </div>
              <div className="mt-6 text-center">
                <a
                  href="https://www.youtube.com/@MartinPenkava1337/videos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                  Všechna videa na kanálu
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos Grid */}
      <section className="relative z-10 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              🎬 Vybraná videa
            </h2>
            <p className="text-center text-gray-400 mb-12">
              Nejlepší momenty z našeho kanálu
            </p>

            {/* Immersive Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredVideos.map((video, index) => (
                <div
                  key={video.id}
                  className={`group bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-500/20 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 hover:border-purple-400/50 ${
                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    ></iframe>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-gray-400">{video.description}</p>
                    )}
                    <div className="mt-3">
                      <a
                        href={`https://youtu.be/${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-flex items-center"
                      >
                        Otevřít na YouTube
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Channel Description */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
              <h3 className="text-2xl font-bold mb-4 text-white">O kanálu</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Vítejte na YouTube kanálu Komplexáců! Zde najdete herní obsah, vtipné momenty z našich her, 
                retro gaming vzpomínky a mnoho dalšího. Od League of Legends přes Counter Strike až po 
                wrestlingové hry - máme tu pro vás vše, co se týká našeho klanu.
              </p>
              
              <div className="flex flex-wrap gap-3">
                {['Gaming', 'League of Legends', 'Counter Strike', 'WWE Games', 'Retro', 'Komplexáci'].map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div 
            className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-red-900/50 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/30 text-center"
            style={{
              boxShadow: '0 20px 60px rgba(138, 43, 226, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <h2 className="text-4xl font-bold mb-6 text-white">
              Nepromeškej nový obsah! 🎬
            </h2>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Odebírej náš kanál a zapni zvonečkem, aby ti neuniklo žádné nové video z našeho klanu.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://www.youtube.com/@MartinPenkava1337?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center px-10 py-5 rounded-full text-xl font-bold text-white overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/50"
                style={{
                  background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                  boxShadow: '0 15px 40px rgba(255, 0, 0, 0.4)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <svg className="w-8 h-8 mr-3 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span className="relative z-10">Odebírat teď!</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-purple-500/20" style={{ backgroundColor: 'var(--darker-bg)' }}>
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 Komplexáci | YouTube: Martin Pěnkava
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <a 
              href="/" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Hlavní stránka
            </a>
            <a 
              href="https://www.youtube.com/@MartinPenkava1337" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              YouTube
            </a>
            <a 
              href="https://discord.gg/e6BEQpQRBA" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
