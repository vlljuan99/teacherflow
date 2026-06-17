import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBox } from "@/components/notebook/search-box";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Buscador IA"
        description="Busca en todos los cuadernos por significado, no solo por palabras clave."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Búsqueda semántica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SearchBox placeholder='Ej.: "ejercicio largo sobre medio ambiente con Juan" o "cuándo vimos Past Perfect"' />
        </CardContent>
      </Card>
    </div>
  );
}
