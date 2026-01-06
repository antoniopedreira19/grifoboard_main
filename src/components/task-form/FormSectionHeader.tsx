
import { Label } from "@/components/ui/label";

interface FormSectionHeaderProps {
  label: string;
  description?: string;
}

const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({
  label,
  description
}) => {
  return (
    <div className="mb-3">
      <Label className="text-base font-semibold">{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};

export default FormSectionHeader;
