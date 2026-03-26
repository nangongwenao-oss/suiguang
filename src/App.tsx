import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Cpu, 
  Microscope, 
  Lightbulb, 
  BookOpen, 
  ShieldCheck, 
  Send, 
  Loader2,
  Database,
  Award,
  Zap,
  Archive,
  Clock,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { AgentRole, Message, KnowledgeCapsule, RefereeReport, SalonState, SavedCapsule } from './types';
import { generateAgentResponse, generateCapsule, evaluateCapsule } from './services/geminiService';

const AGENT_ICONS: Record<AgentRole, any> = {
  Host: Cpu,
  Scientist: Microscope,
  Engineer: Database,
  Philosopher: BookOpen,
  Innovator: Lightbulb,
  Miner: Sparkles,
  Referee: ShieldCheck
};

const AGENT_COLORS: Record<AgentRole, string> = {
  Host: 'text-sky-blue',
  Scientist: 'text-emerald-500',
  Engineer: 'text-warm-orange',
  Philosopher: 'text-indigo-500',
  Innovator: 'text-goose-yellow',
  Miner: 'text-cyan-500',
  Referee: 'text-rose-500'
};

const AGENT_BG: Record<AgentRole, string> = {
  Host: 'bg-sky-blue/10',
  Scientist: 'bg-emerald-500/10',
  Engineer: 'bg-warm-orange/10',
  Philosopher: 'bg-indigo-500/10',
  Innovator: 'bg-goose-yellow/10',
  Miner: 'bg-cyan-500/10',
  Referee: 'bg-rose-500/10'
};

const AGENT_NAMES: Record<AgentRole, string> = {
  Host: '总主持人',
  Scientist: '科学家',
  Engineer: '工程师',
  Philosopher: '哲学家',
  Innovator: '创新者',
  Miner: '知识萃取者',
  Referee: '裁判员'
};

export default function App() {
  const [state, setState] = useState<SalonState>({
    theme: '',
    status: 'idle',
    messages: [],
    savedCapsules: JSON.parse(localStorage.getItem('saved_capsules') || '[]'),
  });
  const [inputTheme, setInputTheme] = useState('');
  const [activeTab, setActiveTab] = useState<'salon' | 'hub'>('salon');
  const [selectedCapsule, setSelectedCapsule] = useState<SavedCapsule | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  useEffect(() => {
    localStorage.setItem('saved_capsules', JSON.stringify(state.savedCapsules));
  }, [state.savedCapsules]);

  const startSalon = async () => {
    if (!inputTheme.trim()) return;
    
    const initialTheme = inputTheme;
    setState(prev => ({
      ...prev,
      theme: initialTheme,
      status: 'discussing',
      messages: [],
      capsule: undefined,
      report: undefined
    }));
    setActiveTab('salon');

    try {
      // 1. Host Intro
      const hostIntro = await generateAgentResponse('Host', initialTheme, "沙龙启动，请介绍主题。");
      const msg1: Message = { id: Date.now().toString(), role: 'Host', content: hostIntro, timestamp: Date.now() };
      setState(prev => ({ ...prev, messages: [msg1] }));

      // 2. Discussion Rounds
      const roles: AgentRole[] = ['Scientist', 'Engineer', 'Philosopher', 'Innovator'];
      let currentMessages = [msg1];

      for (let round = 0; round < 2; round++) {
        for (const role of roles) {
          const context = currentMessages.map(m => `${AGENT_NAMES[m.role]}: ${m.content}`).join('\n');
          const response = await generateAgentResponse(role, initialTheme, context);
          const newMsg: Message = { id: Math.random().toString(), role, content: response, timestamp: Date.now() };
          currentMessages = [...currentMessages, newMsg];
          setState(prev => ({ ...prev, messages: currentMessages }));
        }
        
        const summaryContext = currentMessages.map(m => `${AGENT_NAMES[m.role]}: ${m.content}`).join('\n');
        const summary = await generateAgentResponse('Host', initialTheme, `请对本轮讨论进行阶段性总结并引导下一轮：\n${summaryContext}`);
        const summaryMsg: Message = { id: Math.random().toString(), role: 'Host', content: summary, timestamp: Date.now() };
        currentMessages = [...currentMessages, summaryMsg];
        setState(prev => ({ ...prev, messages: currentMessages }));
      }

      // 3. Knowledge Extraction
      setState(prev => ({ ...prev, status: 'extracting' }));
      const fullContext = currentMessages.map(m => `${AGENT_NAMES[m.role]}: ${m.content}`).join('\n');
      const extraction = await generateAgentResponse('Miner', initialTheme, fullContext);
      const minerMsg: Message = { id: Math.random().toString(), role: 'Miner', content: extraction, timestamp: Date.now() };
      setState(prev => ({ ...prev, messages: [...prev.messages, minerMsg], status: 'generating' }));

      // 4. Generate Capsule
      const capsule = await generateCapsule(initialTheme, fullContext);
      setState(prev => ({ ...prev, capsule, status: 'evaluating' }));

      // 5. Evaluate
      const report = await evaluateCapsule(capsule);
      
      // Auto save
      const newSaved: SavedCapsule = {
        id: Date.now().toString(),
        capsule,
        report,
        timestamp: Date.now()
      };
      
      setState(prev => ({ 
        ...prev, 
        report, 
        status: 'completed',
        savedCapsules: [newSaved, ...prev.savedCapsules]
      }));

    } catch (error) {
      console.error("Salon Error:", error);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const deleteCapsule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      savedCapsules: prev.savedCapsules.filter(c => c.id !== id)
    }));
    if (selectedCapsule?.id === id) setSelectedCapsule(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="w-full mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-orange/10 border border-warm-orange/20 text-warm-orange text-xs font-mono mb-4"
        >
          <Zap size={14} />
          <span>SUÌ GUĀNG MASKnowledge Salon v1.1</span>
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-gradient">
          燧光知识沙龙
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
          模拟“爱迪生式发明过程”，通过跨学科智能体对话，实现知识碰撞、规律提炼、创新推演。
        </p>

        {/* Tabs */}
        <div className="flex justify-center mt-8">
          <div className="bg-white/50 p-1 rounded-xl border border-slate-200 flex gap-1">
            <button 
              onClick={() => setActiveTab('salon')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'salon' ? 'bg-warm-orange text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Cpu size={16} />
              知识沙龙
            </button>
            <button 
              onClick={() => setActiveTab('hub')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'hub' ? 'bg-sky-blue text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Archive size={16} />
              知识胶囊库 ({state.savedCapsules.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'salon' ? (
            <motion.div 
              key="salon-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left: Input & Status (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-warm-orange">
                    <Cpu size={20} />
                    启动沙龙
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">讨论主题</label>
                      <textarea 
                        value={inputTheme}
                        onChange={(e) => setInputTheme(e.target.value)}
                        placeholder="例如：量子计算在生物制药中的应用前景..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-warm-orange/50 outline-none transition-all min-h-[120px] resize-none"
                        disabled={state.status !== 'idle' && state.status !== 'completed'}
                      />
                    </div>
                    <button 
                      onClick={startSalon}
                      disabled={state.status !== 'idle' && state.status !== 'completed'}
                      className="w-full bg-warm-orange hover:bg-warm-orange/90 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-warm-orange/20"
                    >
                      {state.status === 'idle' || state.status === 'completed' ? (
                        <>
                          <Send size={18} />
                          <span>启动燧光沙龙</span>
                        </>
                      ) : (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>正在进行讨论...</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Tracker */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4">系统流程状态</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'discussing', label: '跨学科讨论', icon: BookOpen, color: 'text-sky-blue' },
                      { id: 'extracting', label: '知识萃取', icon: Sparkles, color: 'text-indigo-500' },
                      { id: 'generating', label: '生成知识胶囊', icon: Lightbulb, color: 'text-goose-yellow' },
                      { id: 'evaluating', label: '裁判员评审', icon: ShieldCheck, color: 'text-rose-500' },
                    ].map((step, i) => {
                      const isActive = state.status === step.id;
                      const isDone = ['extracting', 'generating', 'evaluating', 'completed'].includes(state.status) && i === 0 ||
                                     ['generating', 'evaluating', 'completed'].includes(state.status) && i === 1 ||
                                     ['evaluating', 'completed'].includes(state.status) && i === 2 ||
                                     state.status === 'completed' && i === 3;
                      
                      return (
                        <div key={step.id} className={`flex items-center gap-3 text-sm ${isActive ? step.color : isDone ? 'text-emerald-500' : 'text-slate-400'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${isActive ? `border-current animate-pulse` : isDone ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200'}`}>
                            {isDone ? <ShieldCheck size={14} /> : <step.icon size={14} />}
                          </div>
                          <span className="font-medium">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Discussion & Result (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                <div className="glass-panel rounded-2xl flex flex-col h-[600px] overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-white/50 flex justify-between items-center">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Salon Log Stream</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                      <div className="w-2 h-2 rounded-full bg-goose-yellow"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/30">
                    {state.messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                        <Cpu size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">等待沙龙启动...</p>
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {state.messages.map((msg) => {
                        const Icon = AGENT_ICONS[msg.role];
                        return (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm ${AGENT_BG[msg.role]} ${AGENT_COLORS[msg.role]}`}>
                              <Icon size={20} />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${AGENT_COLORS[msg.role]}`}>
                                  {AGENT_NAMES[msg.role]}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/50 p-3 rounded-xl border border-slate-50">
                                {msg.content}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Result: Knowledge Capsule */}
                {state.capsule && (
                  <CapsuleDisplay capsule={state.capsule} report={state.report} />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="hub-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Capsule List (4 cols) */}
              <div className="lg:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-sky-blue">
                  <Archive size={20} />
                  已存胶囊
                </h2>
                {state.savedCapsules.length === 0 ? (
                  <div className="glass-panel p-12 rounded-2xl text-center text-slate-400">
                    <Archive size={40} className="mx-auto mb-4 opacity-20" />
                    <p>暂无沉淀的知识胶囊</p>
                  </div>
                ) : (
                  state.savedCapsules.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setSelectedCapsule(item)}
                      className={`w-full text-left glass-panel p-4 rounded-xl transition-all group relative ${selectedCapsule?.id === item.id ? 'ring-2 ring-sky-blue border-sky-blue/30 bg-sky-blue/5' : 'hover:bg-white'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-sky-blue uppercase tracking-widest">{item.capsule.level}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={(e) => deleteCapsule(item.id, e)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-sky-blue transition-colors">{item.capsule.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.capsule.coreQuestion}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Zap size={12} />
                          {item.report.tokenValue}
                        </div>
                        <ChevronRight size={14} className={`text-slate-300 transition-transform ${selectedCapsule?.id === item.id ? 'translate-x-1 text-sky-blue' : ''}`} />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Capsule Detail (8 cols) */}
              <div className="lg:col-span-8">
                {selectedCapsule ? (
                  <CapsuleDisplay capsule={selectedCapsule.capsule} report={selectedCapsule.report} />
                ) : (
                  <div className="glass-panel h-[600px] rounded-2xl flex flex-col items-center justify-center text-slate-400 text-center p-8">
                    <Sparkles size={48} className="mb-4 opacity-10" />
                    <h3 className="text-xl font-medium mb-2">选择一个知识胶囊</h3>
                    <p className="max-w-xs">从左侧列表中选择一个胶囊，查看跨学科讨论沉淀出的核心智慧。</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-slate-200 w-full text-center text-slate-400 text-xs font-mono">
        <p>© 2026 SUÌ GUĀNG MASKnowledge Salon. ALL RIGHTS RESERVED.</p>
        <p className="mt-2 text-slate-300">POWERED BY GEMINI 3.1 PRO & MULTI-AGENT ARCHITECTURE</p>
      </footer>
    </div>
  );
}

function CapsuleDisplay({ capsule, report }: { capsule: KnowledgeCapsule, report?: RefereeReport }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-2xl overflow-hidden capsule-glow border-warm-orange/20"
    >
      <div className="bg-gradient-to-r from-warm-orange to-goose-yellow p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">
            <Sparkles size={12} />
            KNOWLEDGE CAPSULE
          </div>
          <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
            等级：{capsule.level}
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{capsule.title}</h2>
        <p className="text-white/90 text-sm italic">核心问题：{capsule.coreQuestion}</p>
      </div>
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/50">
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-sky-blue uppercase tracking-widest mb-3 flex items-center gap-2">
              <Microscope size={14} /> 关键原理
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{capsule.keyPrinciples}</p>
          </section>
          <section>
            <h3 className="text-xs font-bold text-warm-orange uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lightbulb size={14} /> 创新方法
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{capsule.innovationMethods}</p>
          </section>
        </div>
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Cpu size={14} /> 应用场景
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{capsule.applicationScenarios}</p>
          </section>
          <section>
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap size={14} /> 未来潜力
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{capsule.futurePotential}</p>
          </section>
        </div>
      </div>

      {/* Referee Report */}
      {report && (
        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-6">
            <Award size={20} className="text-rose-500" />
            <h3 className="text-lg font-semibold text-slate-800">裁判员评估报告</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: '真 (Truth)', score: report.truth, color: 'text-emerald-600' },
              { label: '善 (Goodness)', score: report.goodness, color: 'text-sky-blue' },
              { label: '美 (Beauty)', score: report.beauty, color: 'text-indigo-600' },
              { label: '灵 (Spirit)', score: report.spirit, color: 'text-warm-orange' },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.score}<span className="text-xs text-slate-300">/10</span></div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-white rounded-2xl border border-slate-100 gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">总分评估</div>
              <div className="text-4xl font-bold text-slate-800">{report.totalScore}<span className="text-sm text-slate-300"> / 40</span></div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">知识等级</div>
              <div className="px-4 py-1 bg-rose-500 text-white rounded-full text-sm font-bold shadow-lg shadow-rose-500/20">
                {report.level}
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">TOKEN 价值</div>
              <div className="text-3xl font-bold text-amber-500 flex items-center justify-center md:justify-end gap-2">
                <Zap size={24} />
                {report.tokenValue}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
