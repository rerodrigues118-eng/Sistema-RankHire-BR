import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'landing', 'index.html');
    const htmlContent = readFileSync(filePath, 'utf-8');
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new NextResponse(
      '<h1>Landing page not found</h1><p>O arquivo public/landing/index.html não foi encontrado.</p>',
      { 
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
