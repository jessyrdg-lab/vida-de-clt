
import { GoogleGenAI, Type } from "@google/genai";
import { GameStats, JobOffer } from "../types";

// Always use process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMonthlyEvent = async (stats: GameStats) => {
  const prompt = `
    Aja como o narrador de um jogo de simulação de vida chamado "Vida de CLT".
    O jogador é um trabalhador brasileiro.
    Status atuais:
    - Saldo: R$ ${stats.saldo.toFixed(2)}
    - Salário: R$ ${stats.salario.toFixed(2)}
    - Estoque de Comida: ${stats.comida} pontos (diminui 1 por mês)
    - Contas Mensais: R$ ${stats.contas.toFixed(2)}
    - Nível de Carreira: ${stats.nivel}
    - Mês de Jogo: ${stats.mes}

    Gere um evento aleatório que aconteceu este mês. Pode ser algo bom (bônus, promoção, achou dinheiro), ruim (multa, doença, eletrodoméstico quebrou) ou neutro/engraçado (fofoca no café, meme da firma).
    Responda apenas com o JSON conforme o esquema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventDescription: {
              type: Type.STRING,
              description: "Uma descrição curta e criativa do evento em português.",
            },
            statChanges: {
              type: Type.OBJECT,
              properties: {
                saldo: { type: Type.NUMBER },
                comida: { type: Type.NUMBER, description: "Pontos de comida ganhos ou perdidos." },
                felicidade: { type: Type.NUMBER },
                experiencia: { type: Type.NUMBER },
                salario: { type: Type.NUMBER },
              },
            },
            type: {
              type: Type.STRING,
              enum: ["positive", "negative", "neutral", "career"]
            }
          },
          required: ["eventDescription", "statChanges", "type"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao gerar evento Gemini:", error);
    return null;
  }
};

export const generateInterviewQuestion = async (offer: JobOffer) => {
  const prompt = `
    Aja como um recrutador da empresa "${offer.empresa}" entrevistando um candidato para a vaga de "${offer.cargo}".
    Gere uma pergunta de entrevista (técnica ou sobre comportamento no trabalho) condizente com o cargo.
    
    DIRETRIZES DE LINGUAGEM:
    - Use um tom SÉRIO e PROFISSIONAL, mas com palavras SIMPLES e DIRETAS.
    - Evite termos "jurídicos" ou palavras muito difíceis/antigas (não use "outrossim", "concomitante", etc).
    - Não use gírias de amigos, mantenha a postura de uma entrevista real e moderna.
    - O objetivo é ser fácil de qualquer pessoa entender, mas sentindo a pressão de uma entrevista séria.
    
    Crie 4 opções de resposta, onde apenas uma é a correta, demonstrando competência e ética profissional.
    Responda apenas com o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctIndex: { type: Type.NUMBER, description: "O índice (0-3) da opção correta." },
            explanation: { type: Type.STRING, description: "Uma explicação direta de por que essa é a resposta profissional correta." }
          },
          required: ["question", "options", "correctIndex", "explanation"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao gerar pergunta de entrevista:", error);
    return null;
  }
};
