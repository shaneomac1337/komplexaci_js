import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

/**
 * Data Export Endpoint - Exports analytics data for backup/analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, csv
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tables = searchParams.get('tables')?.split(',') || ['daily_snapshots', 'game_sessions', 'voice_sessions', 'spotify_sessions'];
    
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    console.log(`📤 Starting data export (format: ${format}, dates: ${startDate} to ${endDate})`);
    
    const exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format,
        dateRange: { startDate, endDate },
        tables
      },
      data: {}
    };
    
    // Build date filter for queries
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = ' WHERE date >= ? AND date <= ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = ' WHERE date >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = ' WHERE date <= ?';
      params.push(endDate);
    }
    
    // Export each requested table
    for (const table of tables) {
      try {
        let query = `SELECT * FROM ${table}`;
        let queryParams = [];
        
        // Adjust date filter based on table structure
        if (table === 'daily_snapshots' && dateFilter) {
          query += dateFilter;
          queryParams = params;
        } else if (['game_sessions', 'voice_sessions', 'spotify_sessions'].includes(table) && dateFilter) {
          // Use start_time for session tables
          const sessionDateFilter = dateFilter.replace(/date/g, 'DATE(start_time)');
          query += sessionDateFilter;
          queryParams = params;
        }
        
        query += ' ORDER BY rowid';
        
        const tableData = database.prepare(query).all(...queryParams);
        exportData.data[table] = tableData;
        
        console.log(`📊 Exported ${tableData.length} records from ${table}`);
      } catch (error) {
        console.warn(`⚠️ Failed to export table ${table}:`, error);
        exportData.data[table] = { error: `Failed to export: ${error}` };
      }
    }
    
    // Get summary statistics
    exportData.summary = {
      totalRecords: Object.values(exportData.data).reduce((sum: number, tableData: any) => {
        return sum + (Array.isArray(tableData) ? tableData.length : 0);
      }, 0),
      tableRecordCounts: Object.fromEntries(
        Object.entries(exportData.data).map(([table, data]) => [
          table, 
          Array.isArray(data) ? data.length : 0
        ])
      )
    };
    
    if (format === 'csv') {
      // For CSV, we'll return a ZIP-like structure with each table as a separate "file"
      const csvData: any = {};
      
      for (const [tableName, tableData] of Object.entries(exportData.data)) {
        if (Array.isArray(tableData) && tableData.length > 0) {
          // Convert to CSV
          const headers = Object.keys(tableData[0]);
          const csvRows = [
            headers.join(','), // Header row
            ...tableData.map(row => 
              headers.map(header => {
                const value = row[header];
                // Escape CSV values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              }).join(',')
            )
          ];
          csvData[`${tableName}.csv`] = csvRows.join('\n');
        }
      }
      
      return NextResponse.json({
        success: true,
        format: 'csv',
        files: csvData,
        summary: exportData.summary,
        metadata: exportData.metadata
      });
    }
    
    // Return JSON format
    return NextResponse.json({
      success: true,
      ...exportData
    });
    
  } catch (error) {
    console.error('❌ Data export failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Data export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // POST method for larger exports or with body parameters
  try {
    const body = await request.json();
    const { format = 'json', startDate, endDate, tables, compression = false } = body;
    
    // Create a new URL with query parameters from body
    const url = new URL(request.url);
    if (format) url.searchParams.set('format', format);
    if (startDate) url.searchParams.set('startDate', startDate);
    if (endDate) url.searchParams.set('endDate', endDate);
    if (tables) url.searchParams.set('tables', Array.isArray(tables) ? tables.join(',') : tables);
    
    // Create new request with GET method and updated URL
    const getRequest = new NextRequest(url.toString(), { method: 'GET' });
    return GET(getRequest);
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request body',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}