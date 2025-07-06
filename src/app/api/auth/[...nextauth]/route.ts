import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { supabaseAdmin } from '@/lib/supabase';
import { getBestDiscordAvatarUrl } from '@/lib/discord-avatar-utils';

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'discord' && profile) {
        try {
          const discordProfile = profile as any;

          // Check if profile already exists
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('discord_id', discordProfile.id)
            .single();

          if (existingProfile) {
            // Update existing user's last login
            const updateData: any = {
              last_login_at: new Date().toISOString(),
              username: discordProfile.username,
              avatar_url: getBestDiscordAvatarUrl(discordProfile.id, discordProfile.avatar, discordProfile.discriminator, 128)
            };

            // Only add email if column exists
            if (discordProfile.email) {
              updateData.email = discordProfile.email;
            }

            await supabaseAdmin
              .from('profiles')
              .update(updateData)
              .eq('discord_id', discordProfile.id);
          } else {
            // Create new profile with auto-generated UUID
            const insertData: any = {
              discord_id: discordProfile.id,
              username: discordProfile.username,
              avatar_url: getBestDiscordAvatarUrl(discordProfile.id, discordProfile.avatar, discordProfile.discriminator, 128),
              role: 'member', // Default role
              is_active: true
            };

            // Only add optional fields if columns exist
            if (discordProfile.email) {
              insertData.email = discordProfile.email;
            }

            const { error } = await supabaseAdmin
              .from('profiles')
              .insert(insertData);

            if (error) {
              console.error('Error creating user profile:', error);
              return false;
            }
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    
    async session({ session, token }) {
      if (session.user) {
        // Get user profile from Supabase using email or Discord ID
        let profile = null;

        // First try to find by email
        if (session.user.email) {
          const { data } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', session.user.email)
            .single();
          profile = data;
        }

        // If not found by email, try by Discord username
        if (!profile && session.user.name) {
          const { data } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('username', session.user.name)
            .single();
          profile = data;
        }

        if (profile) {
          session.user.id = profile.id;
          session.user.role = profile.role || 'guest';
          session.user.permissions = profile.permissions || [];
          session.user.discordId = profile.discord_id;
          session.user.isActive = profile.is_active;
        } else {
          // Default values if profile not found
          session.user.role = 'guest';
          session.user.permissions = [];
          session.user.isActive = true;
        }
      }
      return session;
    },
    
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  }
});

export { handler as GET, handler as POST };
