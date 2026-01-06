import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploaderProps {
  onUpload: (files: File[], legenda?: string) => Promise<void>;
  disabled?: boolean;
}

export function PhotoUploader({ onUpload, disabled }: PhotoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [legenda, setLegenda] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filtrar apenas imagens
    const imageFiles = files.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length !== files.length) {
      toast.warning("Apenas arquivos de imagem são permitidos");
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Selecione pelo menos uma foto");
      return;
    }

    try {
      setUploading(true);
      await onUpload(selectedFiles, legenda || undefined);
      
      // Limpar formulário
      setSelectedFiles([]);
      setLegenda("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast.success(`${selectedFiles.length} foto(s) enviada(s) com sucesso!`);
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast.error(`Erro ao enviar fotos: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Fotos
        </CardTitle>
        <CardDescription>
          Envie fotos do dia selecionado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input de arquivo */}
        <div className="space-y-2">
          <Label htmlFor="photos">Selecionar Fotos</Label>
          <Input
            ref={fileInputRef}
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
          <p className="text-xs text-muted-foreground">
            Selecione uma ou mais imagens (JPG, PNG, etc.)
          </p>
        </div>

        {/* Preview das fotos selecionadas */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Fotos Selecionadas ({selectedFiles.length})</Label>
            <div className="grid grid-cols-3 gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legenda opcional */}
        <div className="space-y-2">
          <Label htmlFor="legenda">Legenda (opcional)</Label>
          <Input
            id="legenda"
            placeholder="Adicione uma descrição para as fotos..."
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            disabled={disabled || uploading}
          />
        </div>

        {/* Botão de upload */}
        <Button
          onClick={handleUpload}
          disabled={disabled || uploading || selectedFiles.length === 0}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Enviando..." : `Enviar ${selectedFiles.length} Foto(s)`}
        </Button>
      </CardContent>
    </Card>
  );
}
