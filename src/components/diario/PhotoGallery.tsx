import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, ZoomIn } from "lucide-react";
import { DiarioFoto } from "@/services/diarioFotosService";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PhotoGalleryProps {
  photos: DiarioFoto[];
  currentUserId?: string;
  onDelete: (id: string, path: string) => void;
  loading?: boolean;
}

export function PhotoGallery({ photos, currentUserId, onDelete, loading }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<DiarioFoto | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  const handlePhotoClick = (photo: DiarioFoto) => {
    setSelectedPhoto(photo);
    setZoomOpen(true);
  };

  const canDelete = (photo: DiarioFoto) => {
    return currentUserId === photo.criado_por;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sem fotos para estes filtros.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Selecione uma data e faça upload de imagens para começar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={photo.legenda || "Foto do diário"}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handlePhotoClick(photo)}
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  {canDelete(photo) && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Deseja excluir esta foto?")) {
                          onDelete(photo.id, photo.path);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Legenda overlay */}
                {photo.legenda && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                    <p className="text-xs text-white line-clamp-2">{photo.legenda}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de zoom */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Foto - {selectedPhoto && format(new Date(selectedPhoto.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.legenda || "Foto do diário"}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {selectedPhoto.legenda && (
                <div>
                  <Badge variant="outline" className="mb-2">Legenda</Badge>
                  <p className="text-sm text-muted-foreground">{selectedPhoto.legenda}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Enviado em {format(new Date(selectedPhoto.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                
                {canDelete(selectedPhoto) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Deseja excluir esta foto?")) {
                        onDelete(selectedPhoto.id, selectedPhoto.path);
                        setZoomOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Foto
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
