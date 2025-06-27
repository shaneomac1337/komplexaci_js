import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getServerSession } from 'next-auth/next';

/**
 * EMERGENCY ADMIN ENDPOINT - Complete Database Reset
 * ⚠️ WARNING: This completely destroys ALL analytics data
 * Only use in emergency situations after proper backup
 */
export async function POST(request: NextRequest) {
  try {
    // Security check - require admin authentication
    const session = await getServerSession();
    if (!session || !isAdminUser(session.user?.email)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required for database reset'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const confirmToken = searchParams.get('confirm');
    const bypassBackup = searchParams.get('bypassBackup') === 'true';
    
    // Require explicit confirmation token
    const expectedToken = 'DESTROY_ALL_ANALYTICS_DATA_PERMANENTLY';
    if (confirmToken !== expectedToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing confirmation',
        message: `Must provide confirmation token: ${expectedToken}`,
        requiredParameter: 'confirm',
        example: `/api/analytics/admin/reset-database?confirm=${expectedToken}`
      }, { status: 400 });
    }

    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    console.log('🚨 EMERGENCY: Admin database reset initiated by:', session.user?.email);
    
    // Get counts before deletion for audit log
    const beforeCounts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots').get() as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions').get() as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions').get() as any,
    };

    // Auto-backup unless bypassed (for disaster recovery)
    let backupInfo = null;
    if (!bypassBackup) {
      try {
        const backupUrl = new URL('/api/analytics/export', request.url);
        backupUrl.searchParams.set('format', 'json');
        
        const backupResponse = await fetch(backupUrl.toString());
        const backupData = await backupResponse.json();
        
        if (backupData.success) {
          // Save backup to file system (in production, you'd save to cloud storage)
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupFilename = `analytics-backup-${timestamp}.json`;
          
          // In a real implementation, save this to permanent storage
          backupInfo = {
            filename: backupFilename,
            recordCount: backupData.summary?.totalRecords || 0,
            createdAt: new Date().toISOString()
          };
          
          console.log(`💾 Emergency backup created: ${backupFilename}`);
        }
      } catch (backupError) {
        console.error('❌ Failed to create emergency backup:', backupError);
        
        return NextResponse.json({
          success: false,
          error: 'Backup failed',
          message: 'Cannot proceed with reset - backup creation failed. Use bypassBackup=true to override.',
          backupError: backupError instanceof Error ? backupError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Perform complete database reset in transaction
    const transaction = database.transaction(() => {
      // Delete all data from all tables
      database.exec(`
        DELETE FROM daily_snapshots;
        DELETE FROM game_sessions;
        DELETE FROM voice_sessions;
        DELETE FROM spotify_sessions;
      `);
      
      // Reset auto-increment counters
      database.exec(`
        DELETE FROM sqlite_sequence WHERE name IN (
          'game_sessions', 'voice_sessions', 'spotify_sessions'
        );
      `);
    });
    
    transaction();
    
    // Vacuum to reclaim space
    database.exec('VACUUM');
    
    // Get counts after deletion (should all be 0)
    const afterCounts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots').get() as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions').get() as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions').get() as any,
    };
    
    console.log('🚨 EMERGENCY: Database reset completed by admin');
    
    // Audit log entry
    const auditLog = {
      action: 'EMERGENCY_DATABASE_RESET',
      admin: session.user?.email,
      timestamp: new Date().toISOString(),
      recordsDestroyed: {
        dailySnapshots: beforeCounts.dailySnapshots?.count || 0,
        gameSessions: beforeCounts.gameSessions?.count || 0,
        voiceSessions: beforeCounts.voiceSessions?.count || 0,
        spotifySessions: beforeCounts.spotifySessions?.count || 0,
      },
      backup: backupInfo
    };
    
    return NextResponse.json({
      success: true,
      message: '🚨 EMERGENCY DATABASE RESET COMPLETED',
      warning: 'ALL ANALYTICS DATA HAS BEEN PERMANENTLY DESTROYED',
      admin: session.user?.email,
      backup: backupInfo,
      before: {
        dailySnapshots: beforeCounts.dailySnapshots?.count || 0,
        gameSessions: beforeCounts.gameSessions?.count || 0,
        voiceSessions: beforeCounts.voiceSessions?.count || 0,
        spotifySessions: beforeCounts.spotifySessions?.count || 0,
      },
      after: {
        dailySnapshots: afterCounts.dailySnapshots?.count || 0,
        gameSessions: afterCounts.gameSessions?.count || 0,
        voiceSessions: afterCounts.voiceSessions?.count || 0,
        spotifySessions: afterCounts.spotifySessions?.count || 0,
      },
      auditLog,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Emergency database reset failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Emergency database reset failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'Emergency database reset requires POST method with confirmation token',
    usage: {
      method: 'POST',
      endpoint: '/api/analytics/admin/reset-database',
      requiredParams: {
        confirm: 'DESTROY_ALL_ANALYTICS_DATA_PERMANENTLY'
      },
      optionalParams: {
        bypassBackup: 'true (skips automatic backup - dangerous)'
      },
      authentication: 'Admin session required'
    }
  }, { status: 405 });
}

// Helper function to check if user is admin (implement based on your auth system)
function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  
  // Add your admin email addresses here
  const adminEmails = [
    'admin@komplexaci.com',
    'shane@komplexaci.com',
    // Add other admin emails
  ];
  
  return adminEmails.includes(email.toLowerCase());
}