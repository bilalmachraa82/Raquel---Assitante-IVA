import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, 
  ScanLine, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Code2, 
  ChevronRight,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';

// --- VISUAL COMPONENTS ---

// 1. ANIMATED SHADER DOTS (Canvas)
const DotGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Grid configuration
    const spacing = 40;
    const dots: { x: number; y: number; baseAlpha: number; phase: number }[] = [];

    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        dots.push({
          x,
          y,
          baseAlpha: 0.1,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      
      // Clear with trail effect
      ctx.fillStyle = '#09090b'; // Zinc 950
      ctx.fillRect(0, 0, width, height);

      dots.forEach(dot => {
        // Shader-like opacity calculation
        const alpha = dot.baseAlpha + Math.sin(time + dot.phase + (dot.x / 500) + (dot.y / 500)) * 0.15;
        
        ctx.fillStyle = `rgba(59, 130, 246, ${Math.max(0, Math.min(0.8, alpha))})`; // Blue-500
        ctx.fillRect(dot.x, dot.y, 2, 2); // Sharp squares, not circles
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />;
};

// 2. BENTO CARD COMPONENT
interface BentoCardProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  featured?: boolean;
}

const BentoCard = ({ children, className = "", delay = 0, featured = false }: BentoCardProps) => (
  <div 
    className={`group relative bg-zinc-900/40 border border-zinc-800 hover:border-blue-600/50 hover:bg-zinc-900/80 transition-all duration-500 overflow-hidden flex flex-col backdrop-blur-sm ${className}`}
    style={{ 
      // Use 'both' to ensure the initial state (opacity: 0) is applied before animation starts
      animation: `fadeInUp 0.8s ease-out ${delay}s both`
    }}
  >
    {/* Grid Pattern Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
    
    {/* Shimmer Effect */}
    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent pointer-events-none z-10" />
    
    {/* Content */}
    <div className="relative z-20 flex-1 flex flex-col h-full">
      {children}
    </div>

    {/* Corner Accents */}
    {featured && (
      <>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/30" />
      </>
    )}
  </div>
);

// 3. CODE PREVIEW COMPONENT
const CodePreview = () => (
  <div className="font-mono text-[10px] md:text-xs text-blue-300/80 p-6 leading-relaxed bg-black/50 h-full border-t border-zinc-800">
    <div className="flex gap-2 mb-3 pb-2 border-b border-zinc-800 opacity-50">
      <div className="w-2 h-2 bg-zinc-600"></div>
      <div className="w-2 h-2 bg-zinc-600"></div>
    </div>
    <p><span className="text-purple-400">async function</span> <span className="text-yellow-200">classifyVat</span>(invoice) {'{'}</p>
    <p className="pl-4"><span className="text-zinc-500">// Extract entities</span></p>
    <p className="pl-4"><span className="text-purple-400">const</span> entities = <span className="text-blue-300">await</span> ocr.extract(invoice.img);</p>
    <p className="pl-4"><span className="text-purple-400">if</span> (entities.nif === <span className="text-green-400">'501...'</span>) {'{'}</p>
    <p className="pl-8"><span className="text-purple-400">return</span> {'{'}</p>
    <p className="pl-12">category: <span className="text-green-400">'MEALS'</span>,</p>
    <p className="pl-12">deductible: <span className="text-orange-400">false</span>,</p>
    <p className="pl-12">field: <span className="text-blue-300">null</span></p>
    <p className="pl-8">{'}'}</p>
    <p className="pl-4">{'}'}</p>
    <p className="pl-4"><span className="text-zinc-500">// AI Confidence > 90%</span></p>
    <p>{'}'}</p>
  </div>
);

// --- MAIN PAGE ---

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onEnterApp}>
            <div className="w-5 h-5 bg-blue-600 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
              <div className="w-2 h-2 bg-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">RAQUEL<span className="text-blue-600">.AI</span></span>
          </div>
          <button 
            onClick={onEnterApp}
            className="text-xs font-bold uppercase tracking-widest hover:text-blue-500 transition-colors flex items-center gap-2"
          >
            Login <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen min-h-[600px] flex items-center border-b border-zinc-800">
        <DotGrid />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-20">
          
          {/* Left: Content */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 border border-blue-500/20 bg-blue-900/10 px-4 py-1.5 text-xs text-blue-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              SISTEMA V1.0 - BETA DISPONÍVEL
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
              CLASSIFICAÇÃO<br />
              <span className="text-white relative">
                IVA AUTÓNOMA
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-blue-600/50" />
              </span>
            </h1>
            
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-lg border-l-2 border-blue-600/30 pl-6">
              O motor que transforma faturas físicas em declarações de IVA prontas. Zero configuração. Precisão 99%.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={onEnterApp}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="bg-blue-600 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-white/10 transform transition-transform duration-300 ${isHovering ? 'translate-x-0' : '-translate-x-full'}`} />
                <span className="relative">Inicializar Demo</span>
                <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="border border-zinc-700 text-zinc-300 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2">
                <Terminal className="w-4 h-4" />
                Docs Técnicos
              </button>
            </div>
          </div>

          {/* Right: Waitlist Input / Preview */}
          <div className="hidden lg:block relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-2xl" />
            <div className="relative bg-zinc-900 border border-zinc-800 p-8 space-y-6">
              
              {/* Status Header */}
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-zinc-400 uppercase">System Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                  <span className="text-xs text-green-500 font-bold">ONLINE</span>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex justify-between">
                  <span>Acesso Antecipado</span>
                  <span className="text-blue-500">24 Vagas Restantes</span>
                </label>
                <div className="flex gap-0">
                  <div className="bg-zinc-950 border border-zinc-700 border-r-0 px-3 flex items-center">
                    <Search className="w-4 h-4 text-zinc-600" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="bg-zinc-950 border border-zinc-700 text-white px-4 py-3 w-full focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-zinc-700"
                  />
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase transition-colors">
                    Join
                  </button>
                </div>
              </div>

              {/* Mock Terminal Output */}
              <div className="bg-black border border-zinc-800 p-4 mt-6">
                 <div className="font-mono text-[10px] space-y-1 opacity-70">
                    <p className="text-zinc-500"># Initializing OCR Engine...</p>
                    <p className="text-zinc-500"># Loading Model: GPT-4o-Financial...</p>
                    <p className="text-zinc-300">> Connection established (14ms)</p>
                    <p className="text-blue-400">> Ready for input stream</p>
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle"></span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO GRID */}
      <section className="py-24 px-6 border-b border-zinc-800 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-4">MÓDULOS DO SISTEMA</h2>
              <div className="h-1 w-20 bg-blue-600"></div>
            </div>
            <div className="hidden md:block text-right text-xs text-zinc-500">
              <p>ARCHITECTURE: MICROSERVICES</p>
              <p>UPTIME: 99.99%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            
            {/* 1. OCR ENGINE (Large) */}
            <BentoCard className="md:col-span-2" delay={0.1} featured>
              <div className="p-8 pb-0 flex justify-between items-start">
                <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                  <ScanLine className="text-blue-400 w-6 h-6" />
                </div>
                <span className="text-xs text-zinc-500 font-bold">CORE.OCR</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">Reconhecimento Ótico</h3>
                <p className="text-zinc-400 text-sm max-w-sm">
                  Extração instantânea de dados não estruturados. Suporta QR Code AT, Faturas Manuais e Recibos térmicos.
                </p>
              </div>
              {/* Abstract Viz */}
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 overflow-hidden pointer-events-none">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className="absolute h-px bg-blue-500 w-full" style={{ top: `${20 * i}%`, animation: `shimmer 3s infinite ${i * 0.2}s` }}></div>
                 ))}
              </div>
            </BentoCard>

            {/* 2. AI LOGIC */}
            <BentoCard delay={0.2} className="bg-zinc-900">
              <div className="p-8 pb-4 flex justify-between items-start">
                 <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                  <Cpu className="text-purple-400 w-6 h-6" />
                </div>
                <span className="text-xs text-zinc-500 font-bold">CORE.AI</span>
              </div>
              <div className="flex-1 overflow-hidden mt-4">
                <CodePreview />
              </div>
            </BentoCard>

            {/* 3. PERFORMANCE */}
            <BentoCard delay={0.3}>
               <div className="p-8 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-auto">
                   <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                    <Zap className="text-yellow-400 w-6 h-6" />
                  </div>
                  <span className="text-xs text-zinc-500 font-bold">SYS.SPEED</span>
                </div>
                
                <div className="space-y-6">
                   <div>
                     <div className="flex justify-between text-xs text-zinc-400 mb-2">
                       <span>OCR PARSE</span>
                       <span className="text-white">120ms</span>
                     </div>
                     <div className="h-1 bg-zinc-800 w-full">
                       <div className="h-full bg-blue-500 w-[85%]"></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs text-zinc-400 mb-2">
                       <span>CLASSIFICATION</span>
                       <span className="text-white">450ms</span>
                     </div>
                     <div className="h-1 bg-zinc-800 w-full">
                       <div className="h-full bg-purple-500 w-[60%]"></div>
                     </div>
                   </div>
                </div>
              </div>
            </BentoCard>

            {/* 4. COMPLIANCE (Large) */}
            <BentoCard className="md:col-span-2" delay={0.4}>
              <div className="p-8 h-full flex flex-col">
                 <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-zinc-800/50 border border-zinc-700">
                    <ShieldCheck className="text-green-400 w-6 h-6" />
                  </div>
                  <span className="text-xs text-zinc-500 font-bold">SYS.SECURE</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Validação Fiscal</h3>
                    <p className="text-zinc-400 text-sm">
                      Cruzamento automático de regras de IVA (C20-C24) com base tributável. Deteção de fraude via hash.
                    </p>
                  </div>
                  <div className="flex items-center gap-6 border-l border-zinc-800 pl-6">
                     <div className="text-center">
                        <div className="text-2xl font-bold text-white">GDPR</div>
                        <div className="text-[10px] text-zinc-500 uppercase">Compliant</div>
                     </div>
                     <div className="text-center">
                        <div className="text-2xl font-bold text-white">AES-256</div>
                        <div className="text-[10px] text-zinc-500 uppercase">Encrypted</div>
                     </div>
                  </div>
                </div>
              </div>
            </BentoCard>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS (Draggable Style) */}
      <section className="py-24 border-b border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold mb-4">DADOS DE CLIENTES</h2>
            <div className="h-1 w-20 bg-blue-600"></div>
          </div>
          <div className="flex gap-2">
            <button className="w-12 h-12 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
               <ArrowRight className="rotate-180 w-4 h-4" />
            </button>
            <button className="w-12 h-12 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
               <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scroll Track */}
        <div className="flex gap-6 px-6 overflow-x-auto pb-12 snap-x scrollbar-hide cursor-grab active:cursor-grabbing">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[400px] bg-zinc-900 border border-zinc-800 p-8 snap-center hover:border-blue-500/50 transition-colors group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    0{i}
                  </div>
                  <div>
                    <div className="font-bold text-white">AllSyn Accounting</div>
                    <div className="text-[10px] text-zinc-500 uppercase">Enterprise Plan</div>
                  </div>
                </div>
                <CheckCircle2 className="text-blue-600 w-5 h-5" />
              </div>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-mono">
                "Reduzimos o tempo de classificação em 70%. A distinção entre despesa pessoal e de atividade é assustadoramente precisa. O motor OCR lê até talões apagados."
              </p>
              
              <div className="flex gap-3 text-[10px] font-bold uppercase text-zinc-600">
                <span className="px-2 py-1 border border-zinc-800">#Automation</span>
                <span className="px-2 py-1 border border-zinc-800">#TaxTech</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-32 px-6 bg-blue-600 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-10 text-white">
            PRONTO PARA A<br/>
            REVOLUÇÃO FISCAL?
          </h2>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              onClick={onEnterApp}
              className="bg-zinc-950 text-white px-10 py-5 text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl flex items-center justify-center gap-3"
            >
              <Code2 className="w-5 h-5" />
              Aceder ao Dashboard
            </button>
            <button className="bg-transparent border-2 border-white text-white px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center gap-3">
              <Lock className="w-4 h-4" />
              Empresas
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-zinc-500 text-xs font-mono">
            © 2025 RAQUEL AI. SYSTEMS ONLINE.
          </div>
          <div className="flex gap-8 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">SLA</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}