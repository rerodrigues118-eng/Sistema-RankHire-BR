import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function LandingPage() {
  try {
    const filePath = join(process.cwd(), 'public', 'landing', 'index.html');
    let htmlContent = await readFile(filePath, 'utf-8');
    
    // Adjust asset paths to be absolute from /landing/
    htmlContent = htmlContent
      .replace(/src="\.\/assets\//g, 'src="/landing/assets/')
      .replace(/href="\.\/assets\//g, 'href="/landing/assets/')
      .replace(/href="\.\/icon/g, 'href="/landing/icon')
      .replace(/src="\.\/placeholder/g, 'src="/landing/placeholder');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  } catch (error) {
    console.error('Failed to load landing page:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-900">
        <div className="text-white text-2xl">Erro ao carregar landing page</div>
      </div>
    );
  }
}
