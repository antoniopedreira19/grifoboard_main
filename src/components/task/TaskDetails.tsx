
interface TaskDetailsProps {
  sector: string;
  discipline: string;
  team: string;
  responsible: string;
  executor: string;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  sector,
  discipline,
  team,
  responsible,
  executor
}) => {
  const formatField = (value: string) => {
    return value && value.trim() !== "" ? value : "Não definido";
  };

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-3 p-2.5 rounded-lg bg-gray-50/80 border border-gray-100">
      <div className="flex flex-col min-w-0">
        <span className="text-gray-500 font-medium text-[9px] uppercase tracking-wide">Setor</span>
        <span className="text-gray-800 font-medium mt-0.5 text-[11px] line-clamp-1 uppercase">{formatField(sector)}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-gray-500 font-medium text-[9px] uppercase tracking-wide">Disciplina</span>
        <span className="text-gray-800 font-medium mt-0.5 text-[11px] line-clamp-1 uppercase">{formatField(discipline)}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-gray-500 font-medium text-[9px] uppercase tracking-wide">Executante</span>
        <span className="text-gray-800 font-medium mt-0.5 text-[11px] line-clamp-1 uppercase">{formatField(team)}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-gray-500 font-medium text-[9px] uppercase tracking-wide">Responsável</span>
        <span className="text-gray-800 font-medium mt-0.5 text-[11px] line-clamp-1 uppercase">{formatField(responsible)}</span>
      </div>
      <div className="flex flex-col min-w-0 col-span-2">
        <span className="text-gray-500 font-medium text-[9px] uppercase tracking-wide">Encarregado</span>
        <span className="text-gray-800 font-medium mt-0.5 text-[11px] line-clamp-1 uppercase">{formatField(executor)}</span>
      </div>
    </div>
  );
};

export default TaskDetails;
