import { InterviewQuestion } from './types';

interface RawQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

// Embaralha as opções e rastreia o novo índice da resposta correta
function shuffleQuestion(q: RawQuestion): InterviewQuestion {
  const correctText = q.options[q.correctAnswer];
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);
  return {
    question: q.question,
    options: shuffled,
    correctIndex: shuffled.indexOf(correctText),
    explanation: 'Esta é a resposta mais profissional e adequada para o contexto.',
  };
}

// ============================================================
// BANCO DE QUESTÕES POR NÍVEL EDUCACIONAL
// ============================================================

const noDegree: RawQuestion[] = [
  { id: 1, question: "Você está procurando seu primeiro emprego. O que mais te motiva a trabalhar?", options: ["Aprender e construir uma carreira.", "Não fazer nada o dia inteiro.", "Apenas passar o tempo."], correctAnswer: 0 },
  { id: 2, question: "Você recebeu uma tarefa simples, mas importante. Como age?", options: ["Faço com atenção para evitar erros.", "Faço correndo para acabar logo.", "Deixo para depois."], correctAnswer: 0 },
  { id: 3, question: "Se chegar atrasado ao trabalho por um imprevisto, o que faria?", options: ["Avisaria o responsável o mais rápido possível.", "Fingiria que nada aconteceu.", "Culparia outra pessoa."], correctAnswer: 0 },
  { id: 4, question: "Um colega pede ajuda com uma tarefa que você sabe fazer. O que faz?", options: ["Tento ajudar dentro das minhas possibilidades.", "Ignoro o pedido.", "Faço o trabalho inteiro por ele sempre."], correctAnswer: 0 },
  { id: 5, question: "Como você reage quando precisa aprender algo novo?", options: ["Tento entender e praticar.", "Evito aprender.", "Espero alguém fazer por mim."], correctAnswer: 0 },
  { id: 6, question: "Você percebe que cometeu um erro em uma tarefa. O que faz?", options: ["Tento corrigir e aviso se necessário.", "Escondo o erro.", "Finjo que não vi."], correctAnswer: 0 },
  { id: 7, question: "Qual dessas características considera mais importante em um funcionário?", options: ["Responsabilidade.", "Sorte.", "Popularidade."], correctAnswer: 0 },
  { id: 8, question: "Você termina suas tarefas antes do prazo. O que faz depois?", options: ["Vejo se posso ajudar ou melhorar algo.", "Fico sem fazer nada.", "Vou embora sem avisar."], correctAnswer: 0 },
  { id: 9, question: "Um cliente está irritado. Como você reage?", options: ["Tento manter a calma e entender o problema.", "Discuto com ele.", "Ignoro completamente."], correctAnswer: 0 },
  { id: 10, question: "Por que uma empresa deveria confiar em você?", options: ["Porque procuro ser responsável e dedicado.", "Porque preciso do emprego.", "Porque sim."], correctAnswer: 0 },
  { id: 11, question: "Você recebeu uma crítica sobre seu trabalho. Como reage?", options: ["Escuto e tento melhorar.", "Fico bravo imediatamente.", "Ignoro o comentário."], correctAnswer: 0 },
  { id: 12, question: "O que você faria se não soubesse como realizar uma tarefa?", options: ["Pediria orientação e tentaria aprender.", "Inventaria qualquer coisa.", "Desistiria."], correctAnswer: 0 },
  { id: 13, question: "Você prefere trabalhar sozinho ou em equipe?", options: ["Consigo trabalhar bem nas duas situações.", "Só sozinho.", "Só em equipe."], correctAnswer: 0 },
  { id: 14, question: "Como você organiza suas responsabilidades?", options: ["Priorizo o que é mais importante.", "Faço tudo aleatoriamente.", "Não organizo."], correctAnswer: 0 },
  { id: 15, question: "Você percebe que um colega está tendo dificuldades. O que faz?", options: ["Tento ajudar quando possível.", "Ignoro.", "Faço tudo por ele."], correctAnswer: 0 },
  { id: 16, question: "Qual é a melhor atitude diante de um problema inesperado?", options: ["Procurar uma solução.", "Entrar em pânico.", "Esperar que alguém resolva."], correctAnswer: 0 },
  { id: 17, question: "Você recebeu várias tarefas ao mesmo tempo. Como procede?", options: ["Organizo por prioridade.", "Faço a primeira que vejo.", "Não faço nenhuma."], correctAnswer: 0 },
  { id: 18, question: "O que significa ser profissional?", options: ["Ser responsável e respeitoso.", "Trabalhar sem parar.", "Nunca cometer erros."], correctAnswer: 0 },
  { id: 19, question: "Qual destas atitudes mais ajuda uma equipe?", options: ["Comunicação e colaboração.", "Competição constante.", "Trabalhar isolado."], correctAnswer: 0 },
  { id: 20, question: "Por que você acredita que pode crescer nesta empresa?", options: ["Porque estou disposto a aprender e melhorar.", "Porque tenho sorte.", "Porque alguém vai me ajudar."], correctAnswer: 0 },
];

const degree: RawQuestion[] = [
  { id: 1, question: "Você está trabalhando em um projeto importante e percebe que não conseguirá terminar tudo sozinho dentro do prazo. Qual seria sua atitude?", options: ["Pediria ajuda à equipe e reorganizaria as prioridades.", "Tentaria fazer tudo sozinho para mostrar capacidade.", "Entregaria incompleto sem avisar."], correctAnswer: 0 },
  { id: 2, question: "Seu gestor pede uma tarefa que você considera pouco eficiente. O que faz?", options: ["Executo a tarefa e apresento sugestões de melhoria de forma respeitosa.", "Recuso imediatamente.", "Faço exatamente como pedido sem pensar sobre o assunto."], correctAnswer: 0 },
  { id: 3, question: "Ao receber uma crítica construtiva, qual é sua reação?", options: ["Analiso os pontos levantados e avalio como posso melhorar.", "Defendo meu trabalho sem ouvir os argumentos.", "Ignoro a crítica porque acredito estar certo."], correctAnswer: 0 },
  { id: 4, question: "Uma tarefa urgente surgiu enquanto você já possui outras atividades em andamento. Como procede?", options: ["Reavalio prioridades e organizo meu tempo.", "Continuo exatamente como estava.", "Faço apenas a nova tarefa."], correctAnswer: 0 },
  { id: 5, question: "O que você considera mais importante em um ambiente profissional?", options: ["Equilíbrio entre resultados, colaboração e aprendizado.", "Apenas resultados.", "Apenas conforto."], correctAnswer: 0 },
  { id: 6, question: "Dois colegas discordam sobre a melhor solução para um problema. O que você faria?", options: ["Avaliaria os argumentos de ambos antes de decidir.", "Escolheria o lado de quem tem mais experiência.", "Evitaria me envolver."], correctAnswer: 0 },
  { id: 7, question: "Uma atividade foi concluída com sucesso graças ao esforço da equipe. Como você apresenta o resultado?", options: ["Reconheço a contribuição de todos os envolvidos.", "Destaco principalmente meu trabalho.", "Não menciono ninguém."], correctAnswer: 0 },
  { id: 8, question: "Você recebe uma oportunidade de liderar um pequeno projeto pela primeira vez. Como reage?", options: ["Aceito o desafio e procuro me preparar adequadamente.", "Recuso por medo de errar.", "Aceito sem qualquer planejamento."], correctAnswer: 0 },
  { id: 9, question: "O que significa produtividade para você?", options: ["Entregar resultados com qualidade e eficiência.", "Trabalhar o máximo de horas possível.", "Fazer várias tarefas ao mesmo tempo."], correctAnswer: 0 },
  { id: 10, question: "Durante uma reunião, você percebe um erro importante no planejamento apresentado. O que faz?", options: ["Aponto o problema de forma respeitosa e proponho alternativas.", "Permaneço em silêncio.", "Critico o responsável na frente de todos."], correctAnswer: 0 },
  { id: 11, question: "Você precisa aprender uma nova ferramenta para desempenhar melhor sua função. Como age?", options: ["Procuro estudar e praticar até dominá-la.", "Espero treinamento obrigatório.", "Continuo trabalhando sem aprender."], correctAnswer: 0 },
  { id: 12, question: "O prazo de um projeto foi reduzido inesperadamente. Qual sua prioridade?", options: ["Reorganizar atividades para manter a qualidade possível.", "Cortar etapas sem analisar riscos.", "Reclamar da mudança."], correctAnswer: 0 },
  { id: 13, question: "Você recebe uma proposta com salário maior, mas menos oportunidades de crescimento. O que considera?", options: ["Avalio tanto os ganhos imediatos quanto o potencial futuro.", "Escolho apenas o maior salário.", "Escolho sem analisar."], correctAnswer: 0 },
  { id: 14, question: "Como você lida com tarefas repetitivas?", options: ["Procuro executá-las com consistência e buscar melhorias quando possível.", "Faço sem atenção.", "Evito realizá-las."], correctAnswer: 0 },
  { id: 15, question: "O que faz um profissional se destacar?", options: ["Capacidade de aprender, adaptar-se e colaborar.", "Trabalhar mais horas que todos.", "Nunca pedir ajuda."], correctAnswer: 0 },
  { id: 16, question: "Você percebe que uma decisão tomada pela equipe não gerou o resultado esperado. Como reage?", options: ["Analiso os erros para melhorar decisões futuras.", "Procuro um culpado.", "Ignoro o ocorrido."], correctAnswer: 0 },
  { id: 17, question: "Como você define sucesso profissional?", options: ["Crescimento contínuo, aprendizado e resultados consistentes.", "Apenas salário alto.", "Apenas reconhecimento."], correctAnswer: 0 },
  { id: 18, question: "Uma nova tecnologia está mudando sua área de atuação. Qual sua postura?", options: ["Busco entender e me adaptar às mudanças.", "Espero que passe.", "Ignoro completamente."], correctAnswer: 0 },
  { id: 19, question: "Você precisa tomar uma decisão sem possuir todas as informações desejadas. O que faz?", options: ["Utilizo os dados disponíveis e ajusto o plano se necessário.", "Espero indefinidamente.", "Decido sem analisar nada."], correctAnswer: 0 },
  { id: 20, question: "Por que deveríamos contratar você para esta vaga?", options: ["Porque acredito poder contribuir enquanto continuo aprendendo e evoluindo.", "Porque preciso muito da vaga.", "Porque não encontrei outra oportunidade."], correctAnswer: 0 },
];

const postgraduate: RawQuestion[] = [
  { id: 1, question: "Sua equipe recebeu um projeto importante. Você pode entregar rapidamente com alguns riscos ou demorar mais e reduzir as chances de problemas. Como procede?", options: ["Avalio os riscos e escolho a abordagem mais adequada ao contexto.", "Sempre escolho a opção mais rápida.", "Sempre escolho a opção mais lenta."], correctAnswer: 0 },
  { id: 2, question: "Um colega muito competente costuma discordar das suas ideias. Como você lida com isso?", options: ["Procuro entender seus argumentos antes de defender minha posição.", "Evito trabalhar com ele.", "Insisto na minha ideia independentemente dos argumentos."], correctAnswer: 0 },
  { id: 3, question: "Você possui orçamento limitado para um projeto. O que considera primeiro?", options: ["O impacto que cada investimento pode gerar.", "Gastar igualmente em todas as áreas.", "Escolher apenas a opção mais barata."], correctAnswer: 0 },
  { id: 4, question: "Como você reage quando uma estratégia cuidadosamente planejada falha?", options: ["Analiso os motivos e ajusto a estratégia.", "Abandono completamente o plano.", "Continuo insistindo sem mudanças."], correctAnswer: 0 },
  { id: 5, question: "Uma oportunidade pode gerar grandes ganhos, mas possui riscos consideráveis. O que faz?", options: ["Analiso os possíveis retornos e riscos antes de decidir.", "Aceito imediatamente.", "Rejeito imediatamente."], correctAnswer: 0 },
  { id: 6, question: "Você precisa escolher entre contratar alguém experiente ou alguém com grande potencial. O que considera?", options: ["As necessidades atuais e futuras da equipe.", "Apenas experiência.", "Apenas potencial."], correctAnswer: 0 },
  { id: 7, question: "O que mais prejudica um projeto bem planejado?", options: ["Falta de adaptação diante das mudanças.", "Falta de sorte.", "Excesso de reuniões."], correctAnswer: 0 },
  { id: 8, question: "Como você avalia seu próprio desempenho profissional?", options: ["Comparo resultados, aprendizados e áreas de melhoria.", "Apenas pelos elogios recebidos.", "Apenas pelo salário."], correctAnswer: 0 },
  { id: 9, question: "Uma decisão beneficia sua equipe hoje, mas pode gerar dificuldades no futuro. Como procede?", options: ["Considero os impactos de curto e longo prazo.", "Priorizo apenas o presente.", "Priorizo apenas o futuro."], correctAnswer: 0 },
  { id: 10, question: "Um funcionário talentoso apresenta desempenho inconsistente. Qual seria sua abordagem?", options: ["Entender as causas e buscar desenvolver seu potencial.", "Substituí-lo imediatamente.", "Ignorar a situação."], correctAnswer: 0 },
  { id: 11, question: "O que diferencia um bom profissional de um excelente profissional?", options: ["Capacidade de gerar resultados e continuar evoluindo.", "Trabalhar mais horas.", "Nunca cometer erros."], correctAnswer: 0 },
  { id: 12, question: "Você recebe informações incompletas para tomar uma decisão importante. Como age?", options: ["Decido com os dados disponíveis e monitoro os resultados.", "Espero ter informações perfeitas.", "Decido sem considerar os dados."], correctAnswer: 0 },
  { id: 13, question: "Como você lida com mudanças constantes em sua área de atuação?", options: ["Busco aprender e me adaptar continuamente.", "Espero a situação estabilizar.", "Ignoro as mudanças."], correctAnswer: 0 },
  { id: 14, question: "Sua equipe atingiu os resultados esperados, mas o processo foi ineficiente. O que conclui?", options: ["Há espaço para melhorar o método utilizado.", "O resultado é tudo que importa.", "O processo importa mais que o resultado."], correctAnswer: 0 },
  { id: 15, question: "Você precisa reduzir custos sem comprometer a qualidade. Qual abordagem parece mais adequada?", options: ["Identificar desperdícios antes de cortar recursos importantes.", "Cortar tudo igualmente.", "Não reduzir custos."], correctAnswer: 0 },
  { id: 16, question: "Como você define liderança?", options: ["Influenciar pessoas para alcançar objetivos comuns.", "Dar ordens constantemente.", "Resolver tudo sozinho."], correctAnswer: 0 },
  { id: 17, question: "Qual é a melhor forma de lidar com um erro recorrente em uma equipe?", options: ["Encontrar a causa do problema e corrigir o processo.", "Punir alguém sempre que acontecer.", "Ignorar enquanto os resultados forem bons."], correctAnswer: 0 },
  { id: 18, question: "Uma nova tecnologia promete aumentar a eficiência, mas exige investimento inicial elevado. Como decide?", options: ["Comparo custos, riscos e benefícios esperados.", "Adoto imediatamente.", "Rejeito imediatamente."], correctAnswer: 0 },
  { id: 19, question: "Você recebe duas propostas de trabalho semelhantes. O que pesa mais na decisão?", options: ["O conjunto de crescimento, estabilidade e oportunidades.", "Apenas salário.", "Apenas benefícios."], correctAnswer: 0 },
  { id: 20, question: "Por que você acredita estar preparado para esta posição?", options: ["Porque desenvolvi competências, experiência e capacidade de adaptação.", "Porque tenho mais tempo disponível.", "Porque acredito no meu potencial."], correctAnswer: 0 },
];

const masters: RawQuestion[] = [
  { id: 1, question: "Você precisa escolher entre três projetos para receber investimento. Todos possuem potencial, mas os recursos são limitados. Qual abordagem considera mais adequada?", options: ["Avaliar impacto, riscos e retorno esperado antes da decisão.", "Priorizar o projeto com maior retorno potencial.", "Distribuir recursos entre todos os projetos."], correctAnswer: 0 },
  { id: 2, question: "Uma equipe altamente qualificada apresenta resultados abaixo do esperado. Qual seria sua primeira ação?", options: ["Identificar obstáculos que estejam limitando o desempenho da equipe.", "Reavaliar as metas estabelecidas.", "Redistribuir responsabilidades entre os membros."], correctAnswer: 0 },
  { id: 3, question: "Um projeto está dentro do prazo, mas surgiram oportunidades para melhorar o resultado final. O que faria?", options: ["Avaliaria se os benefícios justificam os custos da mudança.", "Implementaria as melhorias imediatamente.", "Manteria o planejamento original."], correctAnswer: 0 },
  { id: 4, question: "Ao tomar uma decisão importante, qual fator costuma ter mais peso?", options: ["Consequências de longo prazo para a organização.", "Resultados de curto prazo.", "Facilidade de implementação."], correctAnswer: 0 },
  { id: 5, question: "Uma estratégia trouxe bons resultados durante anos, mas o mercado está mudando rapidamente. Como reagiria?", options: ["Reavaliaria a estratégia considerando o novo cenário.", "Manteria a estratégia até os resultados piorarem.", "Mudaria completamente a abordagem."], correctAnswer: 0 },
  { id: 6, question: "Um colaborador talentoso frequentemente desafia decisões da liderança. Como lidaria com isso?", options: ["Aproveitaria as contribuições mantendo alinhamento com os objetivos da equipe.", "Limitaria sua participação nas decisões.", "Daria mais autonomia para evitar conflitos."], correctAnswer: 0 },
  { id: 7, question: "Você recebe informações contraditórias sobre um problema crítico. O que faz primeiro?", options: ["Buscar fontes adicionais para validar os dados.", "Trabalhar com a informação mais recente.", "Escolher a interpretação mais conservadora."], correctAnswer: 0 },
  { id: 8, question: "Qual é o principal objetivo de uma boa gestão de riscos?", options: ["Equilibrar oportunidades e possíveis impactos negativos.", "Reduzir ao máximo qualquer risco.", "Aproveitar todas as oportunidades disponíveis."], correctAnswer: 0 },
  { id: 9, question: "Uma equipe atingiu suas metas, mas houve desgaste excessivo durante o processo. Como avalia o resultado?", options: ["Positivo, mas com necessidade de melhorar a sustentabilidade do processo.", "Positivo, pois as metas foram alcançadas.", "Negativo, pois houve desgaste."], correctAnswer: 0 },
  { id: 10, question: "Ao liderar mudanças importantes, qual costuma ser o maior desafio?", options: ["Conseguir alinhamento entre pessoas, objetivos e execução.", "Definir o cronograma ideal.", "Escolher a tecnologia correta."], correctAnswer: 0 },
  { id: 11, question: "Uma equipe possui profissionais extremamente talentosos, mas os resultados continuam inconsistentes. Qual fator merece maior atenção?", options: ["O alinhamento entre objetivos e execução.", "A experiência individual dos membros.", "A quantidade de recursos disponíveis."], correctAnswer: 0 },
  { id: 12, question: "Um projeto está consumindo mais recursos do que o previsto. Qual deve ser sua primeira ação?", options: ["Reavaliar a relação entre custos e benefícios esperados.", "Reduzir imediatamente o orçamento.", "Aumentar o investimento para evitar atrasos."], correctAnswer: 0 },
  { id: 13, question: "Qual destas situações representa a melhor oportunidade para inovação?", options: ["Um problema recorrente sem solução eficiente.", "Um processo já otimizado.", "Um mercado sem concorrência."], correctAnswer: 0 },
  { id: 14, question: "Como você avalia uma decisão tomada há meses que apresentou resultados inferiores ao esperado?", options: ["Considerando as informações disponíveis na época da decisão.", "Apenas pelos resultados atuais.", "Comparando com decisões mais recentes."], correctAnswer: 0 },
  { id: 15, question: "Sua equipe precisa aumentar produtividade sem aumentar custos. Qual abordagem parece mais adequada?", options: ["Melhorar processos antes de ampliar recursos.", "Aumentar metas individuais.", "Redistribuir tarefas aleatoriamente."], correctAnswer: 0 },
  { id: 16, question: "Uma oportunidade parece promissora, mas exige abandonar projetos atuais. Como decide?", options: ["Comparando o valor esperado de cada alternativa.", "Priorizando a novidade.", "Mantendo todos os projetos."], correctAnswer: 0 },
  { id: 17, question: "Qual destas características costuma ser mais importante em posições de liderança?", options: ["Capacidade de tomar decisões sob incerteza.", "Conhecimento técnico absoluto.", "Controle direto sobre todas as tarefas."], correctAnswer: 0 },
  { id: 18, question: "Ao analisar um problema complexo, qual costuma ser o maior erro?", options: ["Tratar sintomas como causas.", "Buscar informações adicionais.", "Revisar hipóteses iniciais."], correctAnswer: 0 },
  { id: 19, question: "Quando uma organização cresce rapidamente, o que tende a se tornar mais importante?", options: ["Escalabilidade dos processos.", "Redução de reuniões.", "Especialização excessiva."], correctAnswer: 0 },
  { id: 20, question: "Qual é o principal objetivo de uma estratégia?", options: ["Direcionar decisões diante de recursos limitados.", "Eliminar riscos.", "Garantir resultados."], correctAnswer: 0 },
];

const doctorate: RawQuestion[] = [
  { id: 1, question: "Uma organização possui recursos limitados e diversas oportunidades atrativas. Como deve definir suas prioridades?", options: ["Avaliando o impacto estratégico de cada oportunidade.", "Priorizando as opções de menor custo.", "Priorizando as opções mais populares."], correctAnswer: 0 },
  { id: 2, question: "Uma decisão apresenta alto potencial de retorno e alto risco. Qual abordagem parece mais adequada?", options: ["Avaliar se o risco está dentro dos limites aceitáveis.", "Buscar apenas o maior retorno.", "Evitar qualquer risco."], correctAnswer: 0 },
  { id: 3, question: "O que costuma diferenciar uma organização eficiente de uma organização resiliente?", options: ["A capacidade de adaptação a mudanças inesperadas.", "A velocidade de execução.", "O tamanho da equipe."], correctAnswer: 0 },
  { id: 4, question: "Uma empresa líder de mercado começa a perder participação lentamente. Qual deve ser a principal preocupação?", options: ["Identificar mudanças estruturais no mercado.", "Intensificar campanhas de marketing.", "Reduzir investimentos."], correctAnswer: 0 },
  { id: 5, question: "Uma estratégia apresenta bons resultados atualmente. Isso significa que ela continuará eficaz no futuro?", options: ["Não necessariamente.", "Sim, desde que seja mantida.", "Sim, desde que receba mais recursos."], correctAnswer: 0 },
  { id: 6, question: "Qual destas características costuma gerar vantagem competitiva duradoura?", options: ["Capacidade contínua de aprendizado.", "Crescimento acelerado.", "Grande quantidade de recursos."], correctAnswer: 0 },
  { id: 7, question: "Uma organização deseja melhorar sua tomada de decisão. Qual investimento tende a gerar mais impacto?", options: ["Melhorar a qualidade das informações disponíveis.", "Aumentar o número de gestores.", "Criar mais níveis hierárquicos."], correctAnswer: 0 },
  { id: 8, question: "Qual é o principal risco de decisões baseadas apenas em experiências passadas?", options: ["Ignorar mudanças no contexto atual.", "Subestimar custos.", "Aumentar a burocracia."], correctAnswer: 0 },
  { id: 9, question: "Uma empresa possui processos extremamente eficientes. Qual risco pode surgir?", options: ["Perda de flexibilidade.", "Falta de produtividade.", "Crescimento lento."], correctAnswer: 0 },
  { id: 10, question: "O que costuma gerar melhores resultados em ambientes complexos?", options: ["Ajustes contínuos baseados em feedback.", "Planejamento rígido.", "Controle centralizado."], correctAnswer: 0 },
  { id: 11, question: "Ao avaliar uma oportunidade, qual fator costuma ser mais difícil de estimar?", options: ["Os efeitos indiretos de longo prazo.", "O custo inicial.", "O prazo de execução."], correctAnswer: 0 },
  { id: 12, question: "Uma equipe apresenta excelentes resultados individuais, mas desempenho coletivo abaixo do esperado. Qual hipótese parece mais provável?", options: ["Falta de coordenação entre os membros.", "Falta de conhecimento técnico.", "Excesso de recursos."], correctAnswer: 0 },
  { id: 13, question: "Qual destas métricas pode ser perigosa quando utilizada isoladamente?", options: ["Qualquer métrica.", "Receita.", "Produtividade."], correctAnswer: 0 },
  { id: 14, question: "Uma organização busca eliminar todas as falhas possíveis. Qual consequência negativa pode surgir?", options: ["Redução da inovação.", "Aumento da produtividade.", "Melhoria da colaboração."], correctAnswer: 0 },
  { id: 15, question: "Quando um plano falha repetidamente, qual costuma ser a melhor reação?", options: ["Revisar as premissas utilizadas.", "Executar o plano com mais intensidade.", "Aumentar os recursos investidos."], correctAnswer: 0 },
  { id: 16, question: "Qual destas situações representa maior risco estratégico?", options: ["Acreditar que o sucesso atual garante sucesso futuro.", "Crescimento lento.", "Competição intensa."], correctAnswer: 0 },
  { id: 17, question: "O que geralmente limita mais o crescimento de longo prazo?", options: ["Restrições internas não percebidas.", "Concorrência.", "Falta de marketing."], correctAnswer: 0 },
  { id: 18, question: "Uma organização deve focar em eficiência máxima?", options: ["Apenas até o ponto em que preserve adaptabilidade.", "Sim, sempre.", "Não, eficiência é secundária."], correctAnswer: 0 },
  { id: 19, question: "Qual destas características costuma estar presente em decisões de alta qualidade?", options: ["Clareza sobre os riscos envolvidos.", "Ausência de incertezas.", "Consenso absoluto."], correctAnswer: 0 },
  { id: 20, question: "Qual é o principal objetivo da gestão estratégica?", options: ["Preparar a organização para diferentes cenários futuros.", "Prever o futuro com precisão.", "Eliminar a concorrência."], correctAnswer: 0 },
];

const postDoctorate: RawQuestion[] = [
  { id: 1, question: "Uma empresa possui um produto extremamente lucrativo que financia grande parte de suas operações. Novas tecnologias ameaçam torná-lo obsoleto. Qual estratégia parece mais adequada?", options: ["Maximizar os lucros atuais enquanto investe gradualmente em alternativas.", "Direcionar todos os recursos para as novas tecnologias.", "Proteger o produto atual e evitar mudanças prematuras."], correctAnswer: 0 },
  { id: 2, question: "Sua equipe desenvolveu uma solução inovadora, mas os dados disponíveis ainda são insuficientes para prever seus resultados em larga escala.", options: ["Realizar testes controlados antes de expandir a implementação.", "Implementar rapidamente para obter vantagem competitiva.", "Adiar qualquer decisão até obter mais informações."], correctAnswer: 0 },
  { id: 3, question: "Qual é o maior risco de uma organização que apresenta crescimento acelerado por muitos anos consecutivos?", options: ["Perder a capacidade de adaptação às mudanças futuras.", "Tornar-se excessivamente conhecida no mercado.", "Contratar profissionais demais."], correctAnswer: 0 },
  { id: 4, question: "Uma decisão gera excelentes resultados no curto prazo, mas aumenta significativamente os riscos futuros. Como procede?", options: ["Avaliar se os ganhos justificam os riscos assumidos.", "Priorizar os resultados imediatos.", "Evitar completamente qualquer risco."], correctAnswer: 0 },
  { id: 5, question: "Uma equipe altamente eficiente depende fortemente de um único especialista. Como lidaria com essa situação?", options: ["Desenvolver redundância e compartilhamento de conhecimento.", "Recompensar ainda mais o especialista.", "Manter a estrutura enquanto os resultados forem positivos."], correctAnswer: 0 },
  { id: 6, question: "Você precisa escolher entre uma solução comprovada e uma solução inovadora com potencial superior. Como decide?", options: ["Considerar o contexto e o nível de risco aceitável.", "Escolher sempre a solução comprovada.", "Escolher sempre a solução inovadora."], correctAnswer: 0 },
  { id: 7, question: "Uma empresa deseja aumentar sua eficiência operacional. O que tende a gerar melhores resultados a longo prazo?", options: ["Melhorar continuamente processos e tomada de decisão.", "Exigir mais produtividade dos funcionários.", "Reduzir custos em todas as áreas."], correctAnswer: 0 },
  { id: 8, question: "Qual destas características costuma ser mais importante para a sobrevivência de uma organização ao longo das décadas?", options: ["Capacidade de adaptação.", "Liderança forte.", "Recursos financeiros abundantes."], correctAnswer: 0 },
  { id: 9, question: "Você possui informações suficientes para agir, mas não para eliminar todas as incertezas. O que faz?", options: ["Tomar uma decisão e acompanhar seus resultados.", "Aguardar informações adicionais.", "Delegar a decisão."], correctAnswer: 0 },
  { id: 10, question: "Uma estratégia apresentou bons resultados por anos, mas os indicadores começaram a desacelerar. Como reage?", options: ["Questionar as premissas que sustentam a estratégia atual.", "Intensificar a execução da mesma estratégia.", "Trocar completamente de estratégia."], correctAnswer: 0 },
  { id: 11, question: "O que normalmente limita mais o crescimento de uma organização?", options: ["Suas próprias estruturas e processos.", "A concorrência.", "A economia."], correctAnswer: 0 },
  { id: 12, question: "Uma empresa possui dados detalhados sobre tudo que acontece internamente. Isso garante decisões melhores?", options: ["Não necessariamente.", "Sim, sempre.", "Apenas em mercados estáveis."], correctAnswer: 0 },
  { id: 13, question: "Qual destes fatores costuma ser mais difícil de prever?", options: ["Mudanças de comportamento humano.", "Custos operacionais.", "Produção interna."], correctAnswer: 0 },
  { id: 14, question: "Uma organização deve otimizar suas operações para máxima eficiência?", options: ["Apenas até o ponto em que preserve flexibilidade.", "Sim, sempre.", "Não, eficiência é superestimada."], correctAnswer: 0 },
  { id: 15, question: "Uma empresa busca eliminar todos os riscos de um projeto. Qual consequência pode surgir?", options: ["Isso provavelmente eliminará também muitas oportunidades.", "Isso garante sucesso.", "Isso reduz apenas custos."], correctAnswer: 0 },
  { id: 16, question: "O que costuma diferenciar líderes excepcionais?", options: ["Fazer boas perguntas.", "Tomar decisões rapidamente.", "Trabalhar mais horas."], correctAnswer: 0 },
  { id: 17, question: "Em ambientes complexos, qual é o principal objetivo do planejamento?", options: ["Melhorar a capacidade de adaptação.", "Prever tudo com precisão.", "Evitar mudanças."], correctAnswer: 0 },
  { id: 18, question: "Qual destes cenários representa maior risco para uma organização?", options: ["Acreditar que o sucesso atual garante sucesso futuro.", "Crescer lentamente.", "Ter muitos concorrentes."], correctAnswer: 0 },
  { id: 19, question: "O que normalmente acontece quando métricas se tornam o único objetivo?", options: ["Elas perdem parte de sua utilidade.", "Os resultados melhoram continuamente.", "Os processos se tornam mais eficientes."], correctAnswer: 0 },
  { id: 20, question: "Qual é o sinal mais forte de maturidade estratégica?", options: ["Revisar constantemente as próprias premissas.", "Tomar decisões rapidamente.", "Evitar mudanças frequentes."], correctAnswer: 0 },
];

// Mapa por nível de currículo
const BANKS: Record<number, RawQuestion[]> = {
  0: noDegree,
  1: degree,
  2: postgraduate,
  3: masters,
  4: doctorate,
  5: postDoctorate,
};

// Controla quais perguntas já foram usadas nessa sessão de entrevista
const usedIds: Set<number> = new Set();

export function getInterviewQuestion(nivelCurriculo: number): InterviewQuestion {
  const bank = BANKS[Math.min(nivelCurriculo, 5)] ?? noDegree;
  const available = bank.filter(q => !usedIds.has(q.id));
  // Se esgotou, reseta
  if (available.length === 0) usedIds.clear();
  const pool = available.length > 0 ? available : bank;
  const raw = pool[Math.floor(Math.random() * pool.length)];
  usedIds.add(raw.id);
  return shuffleQuestion(raw);
}

export function resetInterviewSession() {
  usedIds.clear();
}
