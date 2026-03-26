import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, KnowledgeCapsule, RefereeReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const AGENT_PROMPTS: Record<AgentRole, string> = {
  Host: `角色：燧光知识沙龙主持人。任务：组织多智能体讨论，控制节奏，确保讨论围绕主题展开。职责：引入主题、邀请发言、总结观点、推动收敛。风格：理性、宏观、科技战略视角。输出格式：【主持人】当前议题：邀请发言：阶段总结：`,
  Scientist: `角色：科学思想家。任务：从科学规律、实验逻辑、技术路径角度分析问题。思考模式：假设、实验、验证、迭代。输出重点：科学原理、技术实现路径、可验证实验。`,
  Engineer: `角色：工程实现专家。任务：将讨论内容转化为可落地方案。输出重点：技术架构、实现流程、系统模块、工程可行性。`,
  Philosopher: `角色：哲学思想家。任务：从文明、伦理、社会结构角度思考问题。重点：人类意义、技术伦理、文明演化、长期影响。`,
  Innovator: `角色：创新思想激发者。任务：提出突破性假设与未来构想。思考方式：颠覆式创新、跨领域融合、极端假设。目标：产生“灵感跃迁”。`,
  Miner: `角色：知识萃取引擎。任务：从所有Agent对话中提炼核心知识。提炼维度：核心思想、关键规律、创新方法、应用场景。输出结构：【知识提炼】核心观点：关键规律：创新方法：应用场景：`,
  Referee: `角色：知识胶囊评审裁判员。任务：评估知识胶囊价值。评分标准：真（科学真实性 0-10）、善（社会价值 0-10）、美（结构优雅 0-10）、灵（创新突破 0-10）。总分40。评判规则：35+黄金，30+优质，25+普通，20-不合格。`
};

export async function generateAgentResponse(role: AgentRole, theme: string, context: string): Promise<string> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `主题：${theme}\n\n历史对话：\n${context}\n\n请作为${role}进行发言。`,
    config: {
      systemInstruction: AGENT_PROMPTS[role],
    },
  });
  const response = await model;
  return response.text || "无法生成回复。";
}

export async function generateCapsule(theme: string, context: string): Promise<KnowledgeCapsule> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `基于以下沙龙讨论内容，生成一个结构化“知识胶囊”。\n主题：${theme}\n讨论内容：\n${context}`,
    config: {
      systemInstruction: "你是知识胶囊生成系统。任务是将讨论内容压缩为结构化知识胶囊。要求：高度浓缩、逻辑清晰、具有方法论价值。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          coreQuestion: { type: Type.STRING },
          keyPrinciples: { type: Type.STRING },
          innovationMethods: { type: Type.STRING },
          applicationScenarios: { type: Type.STRING },
          futurePotential: { type: Type.STRING },
          level: { type: Type.STRING, enum: ["基础", "进阶", "突破"] }
        },
        required: ["title", "coreQuestion", "keyPrinciples", "innovationMethods", "applicationScenarios", "futurePotential", "level"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function evaluateCapsule(capsule: KnowledgeCapsule): Promise<RefereeReport> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请评估以下知识胶囊：\n${JSON.stringify(capsule, null, 2)}`,
    config: {
      systemInstruction: AGENT_PROMPTS.Referee,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          truth: { type: Type.NUMBER },
          goodness: { type: Type.NUMBER },
          beauty: { type: Type.NUMBER },
          spirit: { type: Type.NUMBER },
          totalScore: { type: Type.NUMBER },
          level: { type: Type.STRING },
          tokenValue: { type: Type.NUMBER }
        },
        required: ["truth", "goodness", "beauty", "spirit", "totalScore", "level", "tokenValue"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}");
}
