import fs from "fs/promises";
import path from "path";

export default async function Page() {
  try {
    const builtIndex = path.join(process.cwd(), 'public', 'landing', 'index.html');
    const raw = await fs.readFile(builtIndex, { encoding: 'utf8' });

    // Rewrite absolute /assets/ paths to /landing/assets/ so Next serves them from public/landing
    let html = raw.replace(/(src|href)=(['"])\/assets\//g, `$1=$2/landing/assets/`);
    // Also handle any leading ./assets or assets/
    html = html.replace(/(src|href)=(['"])(?:\.\/)?assets\//g, `$1=$2/landing/assets/`);

    // Ensure any base href pointing to / is removed so assets resolve under /landing
    html = html.replace(/<base[^>]*>/i, '');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (err) {
    // If built index not found, fallback to the simple static hero
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030307] via-[#071029] to-[#061226] text-white flex items-center justify-center">
        <div className="max-w-4xl w-full px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-black mb-6">RankHire BR — Recrutamento com IA em português</h1>
              <p className="text-lg text-zinc-300 mb-8">Leia currículos, ranqueie candidatos e encontre talentos no LinkedIn — tudo em português e cobrado em Real.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
