
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskDescriptionInputProps {
  description: string;
  setDescription: (description: string) => void;
}

const TaskDescriptionInput: React.FC<TaskDescriptionInputProps> = ({ 
  description, 
  setDescription 
}) => {
  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="description" className="font-medium">Descrição</Label>
      <Input
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição da tarefa"
      />
    </div>
  );
};

export default TaskDescriptionInput;
