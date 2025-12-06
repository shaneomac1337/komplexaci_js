'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Member } from '@/data/members';

interface MemberCardsProps {
  members: Member[];
}

// Function to shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MemberCards({ members }: MemberCardsProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [membersVisible, setMembersVisible] = useState(false);
  const [shuffledMembers, setShuffledMembers] = useState<Member[]>(members);
  const [isHydrated, setIsHydrated] = useState(false);
  const membersRef = useRef<HTMLElement>(null);

  // Shuffle members on client mount (after hydration)
  useEffect(() => {
    setShuffledMembers(shuffleArray(members));
    setIsHydrated(true);
  }, [members]);

  // Intersection Observer for animation
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !membersVisible) {
            setMembersVisible(true);
          }
        });
      },
      {
        threshold: isMobile ? 0.05 : 0.1,
        rootMargin: isMobile ? '50px 0px 0px 0px' : '0px 0px -20px 0px'
      }
    );

    if (membersRef.current) {
      observer.observe(membersRef.current);
    }

    return () => observer.disconnect();
  }, [membersVisible]);

  const handleCardFlip = (memberId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  // Use original order for SSR, shuffled for client
  const displayMembers = isHydrated ? shuffledMembers : members;

  return (
    <section
      ref={membersRef}
      id="clenove"
      className="relative z-10 py-20"
      style={{ backgroundColor: 'var(--dark-bg)' }}
      itemScope
      itemType="https://schema.org/Organization"
    >
      <meta itemProp="name" content="Komplexáci Gaming Clan" />
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12" style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '2.5rem',
          color: 'var(--light-text)'
        }}>
          Naši členové
        </h2>
        <div className="members-grid-exact">
          {displayMembers.map((member, index) => (
            <article
              key={member.id}
              className={`member-card-exact member-${member.id}-exact ${
                membersVisible ? 'animate-in' : ''
              } ${flippedCards.has(member.id) ? 'flipped' : ''}`}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => handleCardFlip(member.id)}
              itemScope
              itemType="https://schema.org/Person"
              itemProp="member"
            >
              <div className="member-card-inner">
                {/* Front of the card - SEO visible */}
                <div className="member-card-front">
                  <div className="member-avatar-exact">
                    <Image
                      src={member.image}
                      alt={`${member.name} - ${member.role} v klanu Komplexáci`}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                      unoptimized
                      itemProp="image"
                    />
                  </div>
                  <h3 className="member-name-exact" itemProp="alternateName">{member.name}</h3>
                  <p className="member-real-name-exact" itemProp="name">{member.realName}</p>
                  <p className="member-role-exact" itemProp="jobTitle">{member.role}</p>
                </div>

                {/* Back of the card */}
                <div className="member-card-back">
                  <button
                    className="member-card-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardFlip(member.id);
                    }}
                    aria-label={`Zavřít kartu ${member.name}`}
                  >
                    ✕
                  </button>

                  <div className="member-name-back" style={{ marginBottom: '15px', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--light-text)' }}>
                    {member.name}
                  </div>

                  <p className="member-bio-text" itemProp="description">
                    {member.bio}
                  </p>

                  <div className="member-stats-list">
                    {member.stats.map((stat, statIndex) => (
                      <div key={statIndex} className="member-stat-item">
                        <span className="member-stat-label">{stat.label}:</span>
                        <span className="member-stat-value">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Hidden SEO content - always visible to crawlers */}
      <div className="sr-only" aria-hidden="true">
        <h3>Členové klanu Komplexáci:</h3>
        <ul>
          {members.map((member) => (
            <li key={member.id}>
              <strong>{member.name}</strong> ({member.realName}) - {member.role}: {member.bio}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
