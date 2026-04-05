import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Upload, FileText, Search, Settings, Download, Edit3, CheckSquare, 
  MessageSquare, PieChart, Moon, Sun, Palette, Globe, ChevronRight, 
  Loader2, Play, Check, AlertCircle, Sparkles
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// --- Constants & Types ---
const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash Preview' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview' }
];

const PAINTER_STYLES = [
  { id: 'none', name: 'Default / None', bg: '' },
  { id: 'vangogh', name: 'Vincent van Gogh', bg: 'bg-gradient-to-br from-blue-900 via-blue-700 to-yellow-500' },
  { id: 'monet', name: 'Claude Monet', bg: 'bg-gradient-to-br from-green-300 via-blue-200 to-pink-200' },
  { id: 'picasso', name: 'Pablo Picasso', bg: 'bg-gradient-to-br from-amber-700 via-orange-500 to-stone-600' },
  { id: 'davinci', name: 'Leonardo da Vinci', bg: 'bg-gradient-to-br from-stone-600 via-stone-400 to-amber-900' },
  { id: 'vermeer', name: 'Johannes Vermeer', bg: 'bg-gradient-to-br from-blue-900 via-slate-800 to-amber-400' },
  { id: 'klimt', name: 'Gustav Klimt', bg: 'bg-gradient-to-br from-yellow-500 via-amber-400 to-yellow-700' },
  { id: 'munch', name: 'Edvard Munch', bg: 'bg-gradient-to-br from-orange-600 via-red-600 to-blue-900' },
  { id: 'dali', name: 'Salvador Dali', bg: 'bg-gradient-to-br from-amber-200 via-blue-300 to-stone-400' },
  { id: 'pollock', name: 'Jackson Pollock', bg: 'bg-gradient-to-br from-stone-800 via-yellow-600 to-stone-900' },
  { id: 'okeeffe', name: 'Georgia O\'Keeffe', bg: 'bg-gradient-to-br from-red-500 via-orange-400 to-pink-300' },
  { id: 'kahlo', name: 'Frida Kahlo', bg: 'bg-gradient-to-br from-green-600 via-yellow-500 to-red-600' },
  { id: 'matisse', name: 'Henri Matisse', bg: 'bg-gradient-to-br from-blue-600 via-green-500 to-red-500' },
  { id: 'warhol', name: 'Andy Warhol', bg: 'bg-gradient-to-br from-pink-500 via-yellow-400 to-cyan-400' },
  { id: 'hokusai', name: 'Katsushika Hokusai', bg: 'bg-gradient-to-br from-blue-800 via-cyan-600 to-slate-100' },
  { id: 'rembrandt', name: 'Rembrandt', bg: 'bg-gradient-to-br from-stone-900 via-amber-900 to-stone-800' },
  { id: 'degas', name: 'Edgar Degas', bg: 'bg-gradient-to-br from-pink-200 via-white to-blue-200' },
  { id: 'cezanne', name: 'Paul Cézanne', bg: 'bg-gradient-to-br from-green-700 via-blue-600 to-amber-500' },
  { id: 'kandinsky', name: 'Wassily Kandinsky', bg: 'bg-gradient-to-br from-red-600 via-blue-600 to-yellow-500' },
  { id: 'rothko', name: 'Mark Rothko', bg: 'bg-gradient-to-b from-red-800 via-orange-600 to-red-900' },
  { id: 'mondrian', name: 'Piet Mondrian', bg: 'bg-gradient-to-br from-red-600 via-white to-blue-600' }
];

const DEFAULT_TEMPLATE = `骨外固定器查驗登記審查指引與審查清單
本文件旨在規範骨外固定器（Orthopedic External Fixators）於醫療器材查驗登記時之臨床前安全與有效性要求，確保產品符合應有之品質標準。
第一部分：骨外固定器臨床前審查指引 (Review Guidance)
1. 產品規格要求 (Product Specifications)
申請者應提供詳盡之產品資料，以評估其設計之合理性與安全性：
用途說明：詳列臨床適應症、適用對象及預定用途。
組件清單：應包含所有系統組件（如：骨針、連接桿、接合器、夾具等）。
工程圖面：檢附具備關鍵幾何尺寸、公差之主要組件工程圖。
材質證明：所有與人體接觸或具結構功能之材質，應標明符合之國際材質標準（如 ASTM F136, ISO 5832 等）。
等同性比較：與已上市類似品執行規格、設計及材質之列表比較，並針對差異處進評估。
2. 生物相容性評估 (Biocompatibility)
依據產品與人體接觸之性質與時間，進行風險評估：
豁免機制：若採用常用之醫用金屬（如 Ti6Al4V, 316L 不鏽鋼等）且製程未改變，得檢具材質證明申請豁免試驗。
執行標準：依據 ISO 10993 系列標準。重點評估項目包括細胞毒性、敏感試驗、刺激試驗、系統毒性、基因毒性及植入試驗。
3. 滅菌確效 (Sterilization)
無菌標準：無菌包裝產品之無菌保證水準 (Sterility Assurance Level, SAL) 必須符合 10⁻⁶。
滅菌驗證：須依據對應之 ISO 標準（如 17665-1, 11135 或 11137）提供滅菌計畫書與報告。對於非無菌提供之產品，應提供建議之醫事機構滅菌方法。
4. 機械性質評估 (Mechanical Testing)
機械測試應能模擬臨床最壞情況（Worst-case scenario）：
執行標準：建議參考 ASTM F1541。
評估項目：
剛性與屈折測量：評估固定器之結構穩定度。
靜態破壞測試：評估裝置在承受過負荷時之極限強度。
疲勞與鬆脫測試：模擬長期使用下之循環負荷，及接合處是否容易產生鬆動。
5. 特定風險與額外評估 (Special Risks and Additional Evaluations)
針對具備特殊宣稱或設計之產品，應額外提供資料：
脊椎或動態機能：若具備微動或動態機能，應提供相關動態功能測試報告。
MRI 相容性：若宣稱 MRI 安全（MRI Safe）或 MRI 條件（MRI Conditional），須依國際標準提交相關磁共振環境評估報告。
第二部分：骨外固定器查驗登記審查清單 (Review Checklist)
審查項目 審查重點 / 具備文件 審查結果 (符合/不適用/待補) 備註說明
1. 產品規格
1.1 用途說明 是否包含完整臨床適應症與適應對象？ □
1.2 組件目錄 是否列出所有系統組件（錨定、橋接、接合器）？ □
1.3 工程圖 主要組件是否具備詳細尺寸與標註？ □
1.4 設計與組合 是否描述各組件之連接、鎖固機制？ □
1.5 材質證明 是否提供材質證明並符合 ASTM/ISO 國際標準？ □
1.6 等同性比較 是否與 Predicate Device 進行列表比較並評估差異？ □
2. 生物相容性
2.1 測試報告 是否依 ISO 10993 提供細胞毒性、過敏等基本報告？ □
2.2 豁免說明 若申請豁免，是否提供符合常規金屬之佐證資料？ □
3. 滅菌確效
3.1 滅菌標準 無菌保證水準 (SAL) 是否符合 ≤ 10⁻⁶？ □
3.2 驗證報告 是否提供符合 ISO 17665/11135/11137 之驗證資料？ □
4. 機械性質
4.1 剛性測試 是否提供符合 ASTM F1541 之剛性測量報告？ □
4.2 靜態破壞 是否執行裝置整體之靜態破壞試驗？ □
4.3 疲勞測試 是否針對組件間之疲勞與鬆脫進行評估？ □
5. 特定風險
5.1 動態機能 脊椎用或具動態功能者，是否提供風險評估或測試？ □
5.2 結構硬度 若硬度低於市場類似品，是否有安全性合理說明？ □
5.3 MRI 相容性 宣稱 MRI 相容者，是否提交環境相容性評估報告？ □
審查結論：
□ 建議核准
□ 需補件再議（補件項目：____________________）
□ 不予核准
審查人員簽章： ____________________ 日期： 2026-03-13`;

// --- Main App Component ---
export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'tc' | 'en'>('tc');
  const [painterStyle, setPainterStyle] = useState('none');
  const [activeTab, setActiveTab] = useState('input');
  
  // Inputs
  const [rawInput, setRawInput] = useState('');
  const [reportTemplate, setReportTemplate] = useState(DEFAULT_TEMPLATE);
  
  // Prompts
  const [researchPrompt, setResearchPrompt] = useState('Analyze the provided medical device information. Search for related FDA 510(k) summaries, guidance documents, and international standards. Synthesize a comprehensive report (2000-3000 words) grounding the analysis with external research findings.');
  const [templatePrompt, setTemplatePrompt] = useState('Based on the comprehensive research report generated previously, apply the provided regulation report template to create a final, structured review guidance and checklist. Ensure all sections of the template are filled with relevant synthesized data.');
  const [skillPrompt, setSkillPrompt] = useState('Create a markdown content for a skill.md file that defines a new agent skill. This skill should generate comprehensive medical device guidance based on the structure and information found in the provided input. Use the standard skill-creator format. Include 3 additional wow features in this skill.');
  
  // Models
  const [researchModel, setResearchModel] = useState('gemini-3.1-pro-preview');
  const [templateModel, setTemplateModel] = useState('gemini-3.1-pro-preview');
  const [skillModel, setSkillModel] = useState('gemini-3.1-pro-preview');
  
  // Results
  const [researchReport, setResearchReport] = useState('');
  const [finalReport, setFinalReport] = useState('');
  const [skillMd, setSkillMd] = useState('');
  
  // Loading States
  const [isResearching, setIsResearching] = useState(false);
  const [isTemplating, setIsTemplating] = useState(false);
  const [isSkilling, setIsSkilling] = useState(false);
  
  // WOW Features State
  const [riskData, setRiskData] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [checklist, setChecklist] = useState<{id: number, text: string, checked: boolean}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // --- Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        setRawInput(fullText);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        alert("Failed to parse PDF. Please try a text file.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const generateResearchReport = async () => {
    if (!rawInput) return alert(language === 'tc' ? '請先輸入或上傳資料' : 'Please input or upload data first');
    setIsResearching(true);
    try {
      const langInstruction = language === 'tc' ? 'Please write the entire report in Traditional Chinese (繁體中文).' : 'Please write the entire report in English.';
      const fullPrompt = `${researchPrompt}\n\n${langInstruction}\n\nInput Information:\n${rawInput}`;
      
      const response = await ai.models.generateContent({
        model: researchModel,
        contents: fullPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are an expert medical device regulatory affairs specialist. Provide highly detailed, structured, and professional reports.",
        }
      });
      
      setResearchReport(response.text || '');
      setActiveTab('research');
      generateWowFeatures(response.text || '');
    } catch (error) {
      console.error(error);
      alert('Error generating research report');
    } finally {
      setIsResearching(false);
    }
  };

  const generateTemplateReport = async () => {
    if (!researchReport) return alert(language === 'tc' ? '請先產生研究報告' : 'Please generate research report first');
    setIsTemplating(true);
    try {
      const langInstruction = language === 'tc' ? 'Please write the entire report in Traditional Chinese (繁體中文).' : 'Please write the entire report in English.';
      const fullPrompt = `${templatePrompt}\n\n${langInstruction}\n\nTemplate:\n${reportTemplate}\n\nResearch Report:\n${researchReport}`;
      
      const response = await ai.models.generateContent({
        model: templateModel,
        contents: fullPrompt,
        config: {
          systemInstruction: "You are an expert medical device regulatory affairs specialist. Apply the template strictly and fill it with synthesized information.",
        }
      });
      
      setFinalReport(response.text || '');
      setActiveTab('template');
    } catch (error) {
      console.error(error);
      alert('Error generating template report');
    } finally {
      setIsTemplating(false);
    }
  };

  const generateSkillMd = async () => {
    if (!finalReport && !researchReport) return alert(language === 'tc' ? '請先產生報告' : 'Please generate a report first');
    setIsSkilling(true);
    try {
      const langInstruction = language === 'tc' ? 'Please write the entire skill.md content in Traditional Chinese (繁體中文).' : 'Please write the entire skill.md content in English.';
      const fullPrompt = `${skillPrompt}\n\n${langInstruction}\n\nContext Report:\n${finalReport || researchReport}`;
      
      const response = await ai.models.generateContent({
        model: skillModel,
        contents: fullPrompt,
        config: {
          systemInstruction: "You are an expert AI agent skill creator. Write a comprehensive SKILL.md file with YAML frontmatter.",
        }
      });
      
      setSkillMd(response.text || '');
      setActiveTab('skill');
    } catch (error) {
      console.error(error);
      alert('Error generating skill.md');
    } finally {
      setIsSkilling(false);
    }
  };

  const generateWowFeatures = async (text: string) => {
    try {
      // 1. Generate Risk Radar Data
      const riskResponse = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze this medical device report and score the following 5 risk dimensions from 0 to 100: Biocompatibility, Mechanical Safety, Sterilization, Clinical Evidence, Regulatory Complexity. Return ONLY a JSON array like: [{"subject": "Biocompatibility", "A": 80, "fullMark": 100}, ...]\n\nReport:\n${text.substring(0, 5000)}`,
        config: { responseMimeType: "application/json" }
      });
      try {
        setRiskData(JSON.parse(riskResponse.text || '[]'));
      } catch (e) { console.error("Failed to parse risk data"); }

      // 2. Generate Checklist
      const checklistResponse = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Extract 5-8 actionable compliance tasks from this report. Return ONLY a JSON array of strings.\n\nReport:\n${text.substring(0, 5000)}`,
        config: { responseMimeType: "application/json" }
      });
      try {
        const items = JSON.parse(checklistResponse.text || '[]');
        setChecklist(items.map((item: string, i: number) => ({ id: i, text: item, checked: false })));
      } catch (e) { console.error("Failed to parse checklist"); }
      
      setChatMessages([{ role: 'assistant', text: language === 'tc' ? '您好！我是法規助理，您可以問我關於這份報告的任何問題。' : 'Hello! I am your regulatory assistant. Ask me anything about this report.' }]);
    } catch (error) {
      console.error("Error generating WOW features", error);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !researchReport) return;
    const newMsgs = [...chatMessages, { role: 'user', text: chatInput }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsChatting(true);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Context Report:\n${researchReport.substring(0, 10000)}\n\nUser Question: ${chatInput}\n\nAnswer the question based on the report context.`
      });
      setChatMessages([...newMsgs, { role: 'assistant', text: response.text || '' }]);
    } catch (error) {
      setChatMessages([...newMsgs, { role: 'assistant', text: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const t = (en: string, tc: string) => language === 'tc' ? tc : en;

  const activePainterBg = PAINTER_STYLES.find(p => p.id === painterStyle)?.bg || '';

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
      activePainterBg
    )}>
      {/* Sidebar */}
      <div className={cn(
        "w-72 flex-shrink-0 border-r p-6 flex flex-col gap-6 overflow-y-auto backdrop-blur-md",
        theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
      )}>
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Sparkles size={20} />
          </div>
          SmartMed 4.1
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t('Settings', '設定')}</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Moon size={16}/> {t('Theme', '主題')}</label>
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
              <button onClick={() => setTheme('light')} className={cn("flex-1 py-1.5 rounded-md text-sm transition-all", theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-slate-500')}>Light</button>
              <button onClick={() => setTheme('dark')} className={cn("flex-1 py-1.5 rounded-md text-sm transition-all", theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500')}>Dark</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Globe size={16}/> {t('Language', '語言')}</label>
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
              <button onClick={() => setLanguage('tc')} className={cn("flex-1 py-1.5 rounded-md text-sm transition-all", language === 'tc' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')}>繁體中文</button>
              <button onClick={() => setLanguage('en')} className={cn("flex-1 py-1.5 rounded-md text-sm transition-all", language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500')}>English</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Palette size={16}/> {t('Painter Style', '畫家風格')}</label>
            <select 
              value={painterStyle} 
              onChange={(e) => setPainterStyle(e.target.value)}
              className="w-full p-2 rounded-lg border bg-transparent dark:border-slate-700 text-sm"
            >
              {PAINTER_STYLES.map(style => (
                <option key={style.id} value={style.id} className="text-black">{style.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t dark:border-slate-800">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            System Online • v4.1.0
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation Tabs */}
        <div className={cn(
          "flex border-b px-6 pt-4 gap-6 backdrop-blur-md",
          theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
        )}>
          {[
            { id: 'input', icon: FileText, label: t('1. Input & Research', '1. 輸入與研究') },
            { id: 'research', icon: Search, label: t('2. Research Report', '2. 研究報告') },
            { id: 'template', icon: Edit3, label: t('3. Template Report', '3. 範本報告') },
            { id: 'skill', icon: Settings, label: t('4. Skill Creator', '4. 技能生成') },
            { id: 'wow', icon: Sparkles, label: t('WOW Features', 'WOW 智能功能') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id 
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className={cn(
            "max-w-5xl mx-auto rounded-2xl shadow-xl border p-8 backdrop-blur-sm",
            theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
          )}>
            
            {/* TAB 1: INPUT */}
            {activeTab === 'input' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t('Input Guidance Document', '輸入指引文件')}</h2>
                  <p className="text-slate-500">{t('Paste text or upload a PDF/TXT/MD file.', '貼上文字或上傳 PDF/TXT/MD 檔案。')}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">{t('Raw Content', '原始內容')}</label>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                      <Upload size={16} />
                      {t('Upload File', '上傳檔案')}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".txt,.md,.pdf"
                    />
                  </div>
                  <textarea 
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    className="w-full h-64 p-4 rounded-xl border bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                    placeholder={t('Paste your guidance content here...', '在此貼上您的指引內容...')}
                  />
                </div>

                <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Search size={18} />
                    {t('FDA Research Configuration', 'FDA 研究設定')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('Model', '模型')}</label>
                      <select 
                        value={researchModel} 
                        onChange={(e) => setResearchModel(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"
                      >
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('Prompt', '提示詞')}</label>
                    <textarea 
                      value={researchPrompt}
                      onChange={(e) => setResearchPrompt(e.target.value)}
                      className="w-full h-24 p-3 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button 
                    onClick={generateResearchReport}
                    disabled={isResearching}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isResearching ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                    {t('Analyze & Generate Research Report', '分析並產生研究報告')}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: RESEARCH REPORT */}
            {activeTab === 'research' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('Comprehensive Research Report', '綜合研究報告')}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadFile(researchReport, 'research_report.md')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
                    >
                      <Download size={16} /> MD
                    </button>
                    <button 
                      onClick={() => downloadFile(researchReport, 'research_report.txt')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
                    >
                      <Download size={16} /> TXT
                    </button>
                  </div>
                </div>

                <textarea 
                  value={researchReport}
                  onChange={(e) => setResearchReport(e.target.value)}
                  className="w-full h-[400px] p-6 rounded-xl border bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed"
                  placeholder={t('Report will appear here...', '報告將顯示於此...')}
                />

                <div className="p-6 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
                    <Edit3 size={18} />
                    {t('Template Report Configuration', '範本報告設定')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('Model', '模型')}</label>
                      <select 
                        value={templateModel} 
                        onChange={(e) => setTemplateModel(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"
                      >
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('Report Template', '報告範本')}</label>
                    <textarea 
                      value={reportTemplate}
                      onChange={(e) => setReportTemplate(e.target.value)}
                      className="w-full h-32 p-3 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('Prompt', '提示詞')}</label>
                    <textarea 
                      value={templatePrompt}
                      onChange={(e) => setTemplatePrompt(e.target.value)}
                      className="w-full h-20 p-3 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button 
                    onClick={generateTemplateReport}
                    disabled={isTemplating}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isTemplating ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                    {t('Generate Template Report', '產生範本報告')}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: TEMPLATE REPORT */}
            {activeTab === 'template' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('Final Template Report', '最終範本報告')}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadFile(finalReport, 'final_report.md')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
                    >
                      <Download size={16} /> MD
                    </button>
                    <button 
                      onClick={() => downloadFile(finalReport, 'final_report.txt')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
                    >
                      <Download size={16} /> TXT
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <textarea 
                    value={finalReport}
                    onChange={(e) => setFinalReport(e.target.value)}
                    className="w-full h-[500px] p-6 rounded-xl border bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed"
                    placeholder={t('Final report will appear here...', '最終報告將顯示於此...')}
                  />
                  <div className="h-[500px] overflow-y-auto p-6 rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-700 prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalReport}</ReactMarkdown>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-purple-800 dark:text-purple-300">
                    <Settings size={18} />
                    {t('Skill Creator Configuration', '技能生成設定')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('Model', '模型')}</label>
                      <select 
                        value={skillModel} 
                        onChange={(e) => setSkillModel(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm"
                      >
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('Prompt', '提示詞')}</label>
                    <textarea 
                      value={skillPrompt}
                      onChange={(e) => setSkillPrompt(e.target.value)}
                      className="w-full h-24 p-3 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button 
                    onClick={generateSkillMd}
                    disabled={isSkilling}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSkilling ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                    {t('Generate skill.md', '產生 skill.md')}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SKILL CREATOR */}
            {activeTab === 'skill' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('Agent Skill Definition', '代理技能定義')}</h2>
                  <button 
                    onClick={() => downloadFile(skillMd, 'skill.md')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium"
                  >
                    <Download size={16} /> skill.md
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <textarea 
                    value={skillMd}
                    onChange={(e) => setSkillMd(e.target.value)}
                    className="w-full h-[600px] p-6 rounded-xl border bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm leading-relaxed"
                    placeholder={t('skill.md content will appear here...', 'skill.md 內容將顯示於此...')}
                  />
                  <div className="h-[600px] overflow-y-auto p-6 rounded-xl border bg-slate-900 text-slate-300 dark:bg-black dark:border-slate-800 prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{skillMd}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WOW FEATURES */}
            {activeTab === 'wow' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{t('AI WOW Features', 'AI WOW 智能功能')}</h2>
                  <p className="text-slate-500">{t('Advanced AI-driven insights based on your generated report.', '基於您產生的報告所提供的進階 AI 洞察。')}</p>
                </div>

                {!researchReport ? (
                  <div className="p-8 text-center border border-dashed rounded-xl text-slate-500">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                    {t('Please generate a research report first to unlock WOW features.', '請先產生研究報告以解鎖 WOW 功能。')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Feature 1: Risk Radar */}
                    <div className="p-6 rounded-xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <PieChart className="text-blue-500" />
                        {t('1. Compliance Risk Radar', '1. 合規風險雷達圖')}
                      </h3>
                      <div className="h-64 w-full">
                        {riskData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                              <PolarGrid stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="Risk Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            <Loader2 className="animate-spin mr-2" size={16} /> {t('Analyzing...', '分析中...')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feature 2: Auto Checklist */}
                    <div className="p-6 rounded-xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckSquare className="text-green-500" />
                        {t('2. Auto-Generated Checklist', '2. 自動生成檢核表')}
                      </h3>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {checklist.length > 0 ? checklist.map(item => (
                          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
                            <button 
                              onClick={() => setChecklist(checklist.map(c => c.id === item.id ? {...c, checked: !c.checked} : c))}
                              className={cn("mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors", item.checked ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-slate-600")}
                            >
                              {item.checked && <Check size={14} />}
                            </button>
                            <span className={cn("text-sm", item.checked && "line-through text-slate-400")}>{item.text}</span>
                          </div>
                        )) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            <Loader2 className="animate-spin mr-2" size={16} /> {t('Extracting...', '萃取中...')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feature 3: Interactive Chatbot */}
                    <div className="lg:col-span-2 p-6 rounded-xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col h-[400px]">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <MessageSquare className="text-purple-500" />
                        {t('3. Interactive Regulatory Chatbot', '3. 互動式法規問答機器人')}
                      </h3>
                      
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[80%] p-3 rounded-2xl text-sm",
                              msg.role === 'user' 
                                ? "bg-blue-600 text-white rounded-tr-sm" 
                                : "bg-slate-100 dark:bg-slate-800 rounded-tl-sm"
                            )}>
                              <div className="prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                          placeholder={t('Ask a question about the report...', '詢問關於報告的問題...')}
                          className="flex-1 p-3 rounded-xl border bg-transparent dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        />
                        <button 
                          onClick={handleChat}
                          disabled={isChatting || !chatInput.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
