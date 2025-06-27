import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

/**
 * DEPRECATED: This endpoint was used for destructive database resets
 * which caused data loss issues. Daily resets now happen automatically
 * at midnight Czech time via the Discord Gateway service.
 *
 * For data management, use:
 * - /api/analytics/cleanup - Remove old data beyond retention period
 * - /api/analytics/export - Backup data before any operations
 * - /api/analytics/admin/reset-database - Emergency full reset (admin only)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Endpoint deprecated',
    message: 'This destructive reset endpoint has been deprecated to prevent data loss. Daily resets happen automatically at midnight Czech time.',
    alternatives: {
      'Daily reset': 'Happens automatically at midnight - no action needed',
      'Data cleanup': 'Use /api/analytics/cleanup to remove old data',
      'Export data': 'Use /api/analytics/export to backup before operations',
      'Emergency reset': 'Contact admin for /api/analytics/admin/reset-database'
    }
  }, { status: 410 }); // 410 Gone - resource no longer available
}

export async function GET(request: NextRequest) {
  return POST(request);
}
