import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface FileUploadButtonProps {
  id: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  selectedFiles?: string | null;
}

export const FileUploadButton = ({ 
  id, 
  accept, 
  onChange, 
  multiple = false,
  selectedFiles 
}: FileUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = '';
      const event = new Event('change', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload
      </Button>
      {selectedFiles && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate max-w-[300px]">{selectedFiles}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
