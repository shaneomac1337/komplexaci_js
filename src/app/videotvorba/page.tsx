"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../components/Header';

export default function VideotvorbaPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsLoaded(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Featured videos organized by category
  const videoCategories = {
    latest: {
      title: 'Nejnovější',
      videos: [
        {
          id: '5CnFK-7bRQc',
          title: 'Best way to play Retro Wrestling Games on Windows',
          description: 'Návod jak hrát retro wrestlingové hry na Windows',
          views: '118',
          featured: true
        }
      ]
    },
    retro: {
      title: 'Retro Gaming',
      videos: [
        {
          id: '5UwzVCNvFvE',
          title: 'WWF Smackdown! Just Bring It - Royal Rumble',
          description: 'Retro wrestling gameplay v 1440p - epický Royal Rumble match',
          platform: 'PS2'
        },
        {
          id: 'C4oJaAkDE4U',
          title: 'WWF Smackdown! 2 Know Your Role - Royal Rumble',
          description: 'PSX retro klasika s 3.2K views - Royal Rumble v 1440p',
          platform: 'PSX'
        }
      ]
    },
    gaming: {
      title: 'Modern Gaming',
      videos: [
        {
          id: 'i3KL5t-EXPw',
          title: 'Komplexáci Gaming Intro (2025)',
          description: 'Nové intro našeho herního klanu pro rok 2025'
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
      ]
    }
  };

  // Flatten all videos for "all" category
  const allVideos = Object.values(videoCategories).flatMap(cat => cat.videos);

  const getFilteredVideos = () => {
    if (activeCategory === 'all') return allVideos;
    return videoCategories[activeCategory as keyof typeof videoCategories]?.videos || [];
  };

  const filteredVideos = getFilteredVideos();
  const featuredVideo = videoCategories.latest.videos[0];

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <Header />

      <main className="relative">
        {/* Hero Section - Full Viewport */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{
            paddingTop: '80px',
            transform: `translateY(${scrollY * 0.5}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: 'radial-gradient(ellipse at center, #1d1d1f 0%, #000000 100%)',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out'
            }}
          />

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 z-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '100px 100px'
            }}
          />

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 backdrop-blur-xl transition-all duration-1000 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transitionDelay: '200ms'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-400">Gaming obsah pro Komplexáce</span>
            </div>

            {/* Main Headline - Apple Style */}
            <h1
              className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-8 leading-none tracking-tight transition-all duration-1000 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                transitionDelay: '400ms'
              }}
            >
              Videotvorba
            </h1>

            {/* Subtitle */}
            <p
              className={`text-xl sm:text-2xl md:text-3xl font-light text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                fontWeight: 300,
                transitionDelay: '600ms'
              }}
            >
              Sleduj náš YouTube kanál plný herního obsahu, vtipných momentů a nostalgických vzpomínek
            </p>

            {/* CTA */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '800ms' }}
            >
              <a
                href="https://www.youtube.com/@MartinPenkava1337?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200"
                style={{
                  boxShadow: '0 4px 16px rgba(0, 113, 227, 0.3)'
                }}
              >
                <span>Odebírat kanál</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <a
                href="https://www.youtube.com/@MartinPenkava1337/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-medium text-white backdrop-blur-xl transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Procházet videa
              </a>
            </div>

            {/* Scroll indicator */}
            <div
              className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '1000ms' }}
            >
              <div className="flex flex-col items-center gap-2 text-gray-500 animate-bounce">
                <span className="text-xs uppercase tracking-widest">Scroll</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Video Section */}
        <section className="relative py-32 px-6" style={{ background: '#000' }}>
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
                Nejnovější video
              </h2>
              <p className="text-lg text-gray-400 font-light">
                Podívejte se na náš nejčerstvější obsah
              </p>
            </div>

            {/* Featured Video Card */}
            <div
              className="group relative rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-500 hover:scale-[1.02]"
              style={{
                background: 'rgba(29, 29, 31, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Video Container */}
              <div className="relative aspect-video overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${featuredVideo.id}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={featuredVideo.title}
                ></iframe>
              </div>

              {/* Content */}
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-red-600">
                    Nové
                  </span>
                  <span className="text-sm text-gray-400">{featuredVideo.views} zhlédnutí</span>
                </div>

                <h3 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                  {featuredVideo.title}
                </h3>

                <p className="text-lg text-gray-400 font-light mb-8 leading-relaxed">
                  {featuredVideo.description}
                </p>

                <a
                  href={`https://youtu.be/${featuredVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-400 font-medium transition-colors"
                >
                  <span>Přehrát na YouTube</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-32 px-6" style={{ background: '#1d1d1f' }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Video obsah", value: "Gaming & Zábava" },
                { label: "Zaměření", value: "Retro & Modern" },
                { label: "Komunita", value: "Komplexáci" }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-12 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div className="text-5xl font-bold mb-4 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-widest font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Gallery Section */}
        <section className="relative py-32 px-6" style={{ background: '#000' }}>
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
                Videotéka
              </h2>
              <p className="text-lg text-gray-400 font-light">
                Nejlepší momenty z našeho kanálu
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {[
                { key: 'all', label: 'Všechny' },
                { key: 'latest', label: 'Nejnovější' },
                { key: 'retro', label: 'Retro Gaming' },
                { key: 'gaming', label: 'Modern Gaming' }
              ].map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === category.key
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{
                    background: activeCategory === category.key ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    border: activeCategory === category.key ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.filter(v => !v.featured).map((video, index) => (
                <div
                  key={video.id}
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                  className="group relative rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:scale-[1.03]"
                  style={{
                    background: 'rgba(29, 29, 31, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-gray-900">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    ></iframe>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2 tracking-tight line-clamp-2">
                      {video.title}
                    </h3>

                    <p className="text-sm text-gray-400 font-light mb-4 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>

                    <a
                      href={`https://youtu.be/${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors"
                    >
                      <span>Přehrát</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="relative py-32 px-6" style={{ background: '#1d1d1f' }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight">
              O kanálu
            </h2>

            <p className="text-xl text-gray-400 font-light leading-relaxed mb-12">
              Vítejte na YouTube kanálu Komplexáců! Zde najdete herní obsah, vtipné momenty z našich her,
              retro gaming vzpomínky a mnoho dalšího. Od League of Legends přes Counter Strike až po
              wrestlingové hry - máme tu pro vás vše, co se týká našeho klanu.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {['Gaming', 'League of Legends', 'Counter Strike', 'WWE Games', 'Retro', 'Komplexáci'].map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#86868b'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-32 px-6" style={{ background: '#000' }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight leading-none">
              Nepromeškej<br />nový obsah
            </h2>

            <p className="text-xl text-gray-400 font-light mb-12 leading-relaxed max-w-2xl mx-auto">
              Odebírej náš kanál a zapni zvonečkem, aby ti neuniklo žádné nové video z našeho klanu.
            </p>

            <a
              href="https://www.youtube.com/@MartinPenkava1337?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-10 py-5 rounded-full text-lg font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200"
              style={{
                boxShadow: '0 8px 24px rgba(0, 113, 227, 0.4)'
              }}
            >
              <span>Odebírat teď</span>
              <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t" style={{ background: '#1d1d1f', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-gray-400">
              © 2025 Komplexáci. Všechna práva vyhrazena.
            </p>

            <div className="flex gap-8">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Hlavní stránka
              </Link>
              <a
                href="https://www.youtube.com/@MartinPenkava1337"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                YouTube
              </a>
              <a
                href="https://discord.gg/e6BEQpQRBA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
