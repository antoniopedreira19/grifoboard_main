import React, { useRef, useState, useEffect } from "react";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PmpPlantaSetoresProps {
  plantaUrl: string | null | undefined;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export const PmpPlantaSetores = React.memo(function PmpPlantaSetores({
  plantaUrl,
  isUploading,
  onUpload,
  onRemove,
}: PmpPlantaSetoresProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  // Reset do erro quando a URL muda
  useEffect(() => {
    setImageError(false);
  }, [plantaUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    e.target.value = "";
  };

  return (
    <div className="h-[450px] w-full border border-slate-200 rounded-xl bg-white shadow-sm p-4 flex-shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-slate-700">Planta de Setores</h3>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            {plantaUrl ? "Trocar" : "Enviar"}
          </Button>
          {plantaUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={onRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 relative flex items-center justify-center">
        {plantaUrl && !imageError ? (
          <img
            src={plantaUrl}
            alt="Planta de Setores"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma planta cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
});
