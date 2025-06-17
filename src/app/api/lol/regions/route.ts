import { NextResponse } from 'next/server';

export async function GET() {
  const regions = [
    {
      code: 'euw1',
      name: 'Europe West',
      flag: '🇪🇺',
      cluster: 'europe',
      countries: ['United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Portugal', 'Ireland', 'Switzerland', 'Austria', 'Denmark', 'Sweden', 'Norway', 'Finland']
    },
    {
      code: 'eun1',
      name: 'Europe Nordic & East',
      flag: '🇪🇺',
      cluster: 'europe',
      countries: ['Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Greece', 'Cyprus']
    },
    {
      code: 'na1',
      name: 'North America',
      flag: '🇺🇸',
      cluster: 'americas',
      countries: ['United States', 'Canada']
    },
    {
      code: 'kr',
      name: 'Korea',
      flag: '🇰🇷',
      cluster: 'asia',
      countries: ['South Korea']
    },
    {
      code: 'jp1',
      name: 'Japan',
      flag: '🇯🇵',
      cluster: 'asia',
      countries: ['Japan']
    },
    {
      code: 'br1',
      name: 'Brazil',
      flag: '🇧🇷',
      cluster: 'americas',
      countries: ['Brazil']
    },
    {
      code: 'la1',
      name: 'Latin America North',
      flag: '🌎',
      cluster: 'americas',
      countries: ['Mexico', 'Guatemala', 'Belize', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama']
    },
    {
      code: 'la2',
      name: 'Latin America South',
      flag: '🌎',
      cluster: 'americas',
      countries: ['Argentina', 'Chile', 'Colombia', 'Peru', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Venezuela']
    },
    {
      code: 'oc1',
      name: 'Oceania',
      flag: '🇦🇺',
      cluster: 'sea',
      countries: ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu']
    },
    {
      code: 'tr1',
      name: 'Turkey',
      flag: '🇹🇷',
      cluster: 'europe',
      countries: ['Turkey']
    },
    {
      code: 'ru',
      name: 'Russia',
      flag: '🇷🇺',
      cluster: 'europe',
      countries: ['Russia', 'Belarus', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan']
    }
  ];

  return NextResponse.json({ regions }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800', // Cache for 24 hours
    },
  });
}
