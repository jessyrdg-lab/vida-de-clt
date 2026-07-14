
import React from 'react';
import { GameEvent } from '../types';

interface ActionLogProps {
  events: GameEvent[];
}

export const ActionLog: React.FC<ActionLogProps> = ({ events }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Log de Atividades</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
        {events.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-600 text-center py-10 text-sm">Nenhuma atividade registrada ainda...</p>
        ) : (
          events.slice().reverse().map((event) => (
            <div 
              key={event.id} 
              className={`p-3 rounded-lg text-sm border-l-4 transition-colors ${
                event.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800 dark:text-emerald-300' :
                event.type === 'negative' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300' :
                event.type === 'career' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-800 dark:text-indigo-300' :
                'bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-800 dark:text-slate-200'
              }`}
            >
              <p>{event.message}</p>
              <span className="text-[10px] opacity-60 dark:opacity-40 mt-1 block">
                Evento registrado
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};