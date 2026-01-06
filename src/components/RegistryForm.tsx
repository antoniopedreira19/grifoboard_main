import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useRegistry } from "@/context/RegistryContext";
import { Loader2, Trash2, Edit2, Check, X, Copy } from "lucide-react";

interface RegistryFormProps {
  onClose: () => void;
  onRegistryCreate: (type: string, value: string) => Promise<void>;
  isSaving: boolean;
}

const RegistryForm: React.FC<RegistryFormProps> = ({ onClose, onRegistryCreate, isSaving }) => {
  const [newSector, setNewSector] = useState("");
  const [newDiscipline, setNewDiscipline] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [newResponsible, setNewResponsible] = useState("");
  const [newExecutor, setNewExecutor] = useState("");
  const [editingItem, setEditingItem] = useState<{ type: string; value: string; newValue: string } | null>(null);
  const {
    sectors,
    disciplines,
    teams,
    responsibles,
    executors,
    isLoading,
    deleteRegistry,
    editRegistry,
    getRegistryItemId,
    selectedObraId,
    refetchRegistries,
  } = useRegistry();
  const [deletingItem, setDeletingItem] = useState<{ type: string; value: string } | null>(null);
  const [copyingFromObras, setCopyingFromObras] = useState(false);
  const [obrasEmpresa, setObrasEmpresa] = useState<Array<{ id: string; nome_obra: string }>>([]);
  const [selectedObras, setSelectedObras] = useState<string[]>([]);

  const handleSubmit = async (type: string) => {
    let value = "";

    switch (type) {
      case "sector":
        value = newSector.trim();
        setNewSector("");
        break;
      case "discipline":
        value = newDiscipline.trim();
        setNewDiscipline("");
        break;
      case "team":
        value = newTeam.trim();
        setNewTeam("");
        break;
      case "responsible":
        value = newResponsible.trim();
        setNewResponsible("");
        break;
      case "executor":
        value = newExecutor.trim();
        setNewExecutor("");
        break;
    }

    if (value) {
      try {
        await onRegistryCreate(type, value);
        toast({
          title: "Cadastro adicionado",
          description: `${value} foi adicionado com sucesso.`,
        });
      } catch (error) {
        // Error is handled by the context
      }
    } else {
      toast({
        title: "Erro no cadastro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (type: string, value: string) => {
    setEditingItem({ type, value, newValue: value });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const itemId = getRegistryItemId(editingItem.type, editingItem.value);
    if (!itemId) {
      toast({
        title: "Erro",
        description: "Item não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await editRegistry(itemId, editingItem.newValue);
      setEditingItem(null);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleDelete = async (type: string, value: string) => {
    setDeletingItem({ type, value });
    try {
      await deleteRegistry(type, value);
    } catch (error: unknown) {
      // Error is handled by the context
    } finally {
      setDeletingItem(null);
    }
  };

  const loadObrasEmpresa = async () => {
    if (!selectedObraId) return;

    try {
      setCopyingFromObras(true);
      const { obrasService } = await import("@/services/obraService");
      const data = await obrasService.listarObrasDaEmpresa(selectedObraId);

      setObrasEmpresa(
        data.map((obra) => ({
          id: obra.id,
          nome_obra: obra.nome_obra,
        })),
      );
    } catch (error) {
      toast({
        title: "Erro ao carregar obras",
        description: "Não foi possível carregar as obras da empresa.",
        variant: "destructive",
      });
      setCopyingFromObras(false);
    }
  };

  const handleSelectObra = (obraId: string) => {
    if (!selectedObras.includes(obraId)) {
      setSelectedObras((prev) => [...prev, obraId]);
    }
  };

  const handleRemoveObra = (obraId: string) => {
    setSelectedObras((prev) => prev.filter((id) => id !== obraId));
  };

  const handleCopyFromObras = async () => {
    if (!selectedObraId || selectedObras.length === 0) return;

    try {
      const { registrosService } = await import("@/services/registroService");

      // Copy from each selected obra
      for (const obraId of selectedObras) {
        await registrosService.copiarRegistrosDeOutraObra(selectedObraId, obraId);
      }

      toast({
        title: "Cadastros copiados",
        description: `Cadastros de ${selectedObras.length} obra(s) foram copiados com sucesso.`,
      });

      // Reset copy state
      setCopyingFromObras(false);
      setObrasEmpresa([]);
      setSelectedObras([]);

      // Refetch registries to show new data
      await refetchRegistries();
    } catch (error) {
      toast({
        title: "Erro ao copiar cadastros",
        description: "Alguns cadastros podem já existir nesta obra.",
        variant: "destructive",
      });
    }
  };

  // Display existing items count
  const renderItemsCount = (items: string[]) => {
    if (isLoading) return <span className="text-xs text-muted-foreground">Carregando...</span>;
    return <span className="text-xs text-muted-foreground">{items.length} itens</span>;
  };

  // Render list of items with delete buttons
  const renderItemsList = (type: string, items: string[]) => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
        </div>
      );

    if (items.length === 0)
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-muted-foreground/25 rounded-lg h-[50vh]">
          <div className="text-muted-foreground/60 text-2xl mb-1">📋</div>
          <div className="text-sm text-muted-foreground font-medium">Nenhum item cadastrado</div>
          <div className="text-xs text-muted-foreground/75 mt-1">Adicione o primeiro item acima</div>
        </div>
      );

    // Sort items alphabetically (case insensitive)
    const sortedItems = [...items].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return (
      // CORREÇÃO: Aumentei a altura para h-[55vh] para ocupar o espaço do modal
      <ScrollArea className="h-[55vh] w-full mt-4 pr-2">
        <div className="space-y-2 pr-2">
          {sortedItems.map((item, index) => {
            const isEditing = editingItem?.type === type && editingItem?.value === item;
            const isDeleting = deletingItem?.type === type && deletingItem?.value === item;

            return (
              <div
                key={index}
                className="group flex items-center justify-between bg-card border border-border hover:border-primary/30 p-3 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0"></div>
                  {isEditing ? (
                    <Input
                      value={editingItem.newValue}
                      onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                      className="text-sm font-medium flex-1 h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium text-foreground truncate">{item}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(type, item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type, item)}
                        disabled={isDeleting}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6">
      {selectedObraId && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {!copyingFromObras ? (
              <Button onClick={loadObrasEmpresa} variant="outline" size="sm" className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar Cadastros de Outras Obras
              </Button>
            ) : obrasEmpresa.length > 0 ? (
              <div className="flex gap-2">
                <Button onClick={handleCopyFromObras} size="sm" className="gap-2" disabled={selectedObras.length === 0}>
                  <Check className="h-4 w-4" />
                  Copiar de {selectedObras.length} Obra(s)
                </Button>
                <Button
                  onClick={() => {
                    setCopyingFromObras(false);
                    setObrasEmpresa([]);
                    setSelectedObras([]);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando obras...
              </div>
            )}
          </div>

          {copyingFromObras && obrasEmpresa.length > 0 && (
            <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-3 text-sm">Selecione as obras para copiar cadastros:</h3>
                <Select onValueChange={handleSelectObra}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma obra" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {obrasEmpresa
                      .filter((obra) => !selectedObras.includes(obra.id))
                      .map((obra) => (
                        <SelectItem key={obra.id} value={obra.id}>
                          {obra.nome_obra}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedObras.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Obras selecionadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedObras.map((obraId) => {
                      const obra = obrasEmpresa.find((o) => o.id === obraId);
                      return obra ? (
                        <Badge
                          key={obraId}
                          variant="secondary"
                          className="px-3 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => handleRemoveObra(obraId)}
                        >
                          {obra.nome_obra} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {copyingFromObras && obrasEmpresa.length === 0 && (
            <div className="bg-muted/30 border rounded-lg p-4 text-center text-sm text-muted-foreground">
              Nenhuma outra obra encontrada nesta empresa.
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="sector" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="sector"
            className="flex flex-col py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span className="font-medium text-xs sm:text-sm">Setor</span>
            <div className="mt-0.5 text-xs opacity-75">{renderItemsCount(sectors)}</div>
          </TabsTrigger>
          <TabsTrigger
            value="discipline"
            className="flex flex-col py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span className="font-medium text-xs sm:text-sm">Disciplina</span>
            <div className="mt-0.5 text-xs opacity-75">{renderItemsCount(disciplines)}</div>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="flex flex-col py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span className="font-medium text-xs sm:text-sm">Executante</span>
            <div className="mt-0.5 text-xs opacity-75">{renderItemsCount(teams)}</div>
          </TabsTrigger>
          <TabsTrigger
            value="responsible"
            className="flex flex-col py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span className="font-medium text-xs sm:text-sm">Resp.</span>
            <div className="mt-0.5 text-xs opacity-75">{renderItemsCount(responsibles)}</div>
          </TabsTrigger>
          <TabsTrigger
            value="executor"
            className="flex flex-col py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span className="font-medium text-xs sm:text-sm">Encarregado</span>
            <div className="mt-0.5 text-xs opacity-75">{renderItemsCount(executors)}</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sector" className="space-y-4">
          <div className="bg-muted/30 border rounded-lg p-4">
            <Label htmlFor="new-sector" className="text-sm font-semibold text-foreground mb-3 block">
              Novo Setor
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="new-sector"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="Digite o nome do setor"
                className="flex-1 h-9"
              />
              <Button
                onClick={() => handleSubmit("sector")}
                disabled={isSaving || newSector.trim() === ""}
                className="whitespace-nowrap h-9 px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Setor"
                )}
              </Button>
            </div>
          </div>
          {renderItemsList("sector", sectors)}
        </TabsContent>

        <TabsContent value="discipline" className="space-y-4">
          <div className="bg-muted/30 border rounded-lg p-4">
            <Label htmlFor="new-discipline" className="text-sm font-semibold text-foreground mb-3 block">
              Nova Disciplina
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="new-discipline"
                value={newDiscipline}
                onChange={(e) => setNewDiscipline(e.target.value)}
                placeholder="Digite o nome da disciplina"
                className="flex-1 h-9"
              />
              <Button
                onClick={() => handleSubmit("discipline")}
                disabled={isSaving || newDiscipline.trim() === ""}
                className="whitespace-nowrap h-9 px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Disciplina"
                )}
              </Button>
            </div>
          </div>
          {renderItemsList("discipline", disciplines)}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="bg-muted/30 border rounded-lg p-4">
            <Label htmlFor="new-team" className="text-sm font-semibold text-foreground mb-3 block">
              Novo Executante
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="new-team"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                placeholder="Digite o nome do executante"
                className="flex-1 h-9"
              />
              <Button
                onClick={() => handleSubmit("team")}
                disabled={isSaving || newTeam.trim() === ""}
                className="whitespace-nowrap h-9 px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Executante"
                )}
              </Button>
            </div>
          </div>
          {renderItemsList("team", teams)}
        </TabsContent>

        <TabsContent value="responsible" className="space-y-4">
          <div className="bg-muted/30 border rounded-lg p-4">
            <Label htmlFor="new-responsible" className="text-sm font-semibold text-foreground mb-3 block">
              Novo Responsável
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="new-responsible"
                value={newResponsible}
                onChange={(e) => setNewResponsible(e.target.value)}
                placeholder="Digite o nome do responsável"
                className="flex-1 h-9"
              />
              <Button
                onClick={() => handleSubmit("responsible")}
                disabled={isSaving || newResponsible.trim() === ""}
                className="whitespace-nowrap h-9 px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Responsável"
                )}
              </Button>
            </div>
          </div>
          {renderItemsList("responsible", responsibles)}
        </TabsContent>

        <TabsContent value="executor" className="space-y-4">
          <div className="bg-muted/30 border rounded-lg p-4">
            <Label htmlFor="new-executor" className="text-sm font-semibold text-foreground mb-3 block">
              Novo Encarregado
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="new-executor"
                value={newExecutor}
                onChange={(e) => setNewExecutor(e.target.value)}
                placeholder="Digite o nome do encarregado"
                className="flex-1 h-9"
              />
              <Button
                onClick={() => handleSubmit("executor")}
                disabled={isSaving || newExecutor.trim() === ""}
                className="whitespace-nowrap h-9 px-4"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Encarregado"
                )}
              </Button>
            </div>
          </div>
          {renderItemsList("executor", executors)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegistryForm;
